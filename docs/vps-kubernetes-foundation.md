# VPS Kubernetes Foundation

## Architecture

```text
Internet
├── 62.84.187.187:6443 -> kube-apiserver
├── 62.84.187.187:80   -> Traefik hostPort
├── 62.84.187.187:443  -> Traefik hostPort
└── 62.84.187.187:<HTTPS NodePort> -> Argo CD UI
                              |
Ubuntu VPS                    v
├── containerd          Gateway API
├── kubelet             ├── GatewayClass: traefik
├── control plane       ├── Gateway: food-delivery
│   ├── kube-apiserver  └── HTTPRoute
│   ├── etcd                ├── /api -> api Service
│   ├── scheduler           └── / -> web Service
│   └── controllers
├── Calico
│   ├── Pod networking/IPAM
│   └── NetworkPolicy enforcement
├── local-path-provisioner
│   └── PostgreSQL PVC -> VPS local disk
└── Argo CD
    ├── platform project
    │   ├── Gateway API
    │   ├── Traefik
    │   ├── cert-manager
    │   ├── metrics-server
    │   └── local-path-provisioner
    └── application project
        └── apps-dev only
```

This is upstream Kubernetes created by kubeadm, not k3s or kind. It exercises
real control-plane, CNI, CSI-like provisioning, Gateway API, RBAC and GitOps
concepts. It is not highly available: the single VPS remains one failure domain.

## Ownership boundaries

| Layer | Owner | Reason |
|---|---|---|
| Ubuntu/kernel/containerd | Ansible roles | Kubernetes API does not exist yet |
| kubeadm control plane | kubeadm | cluster lifecycle and upgrades |
| first CNI | Ansible control-plane role | CoreDNS and Argo CD require Pod networking |
| platform controllers | Argo CD platform project | declarative, versioned reconciliation |
| application resources | Argo CD app project | isolated to `apps-dev` |
| live database password | cluster Secret | secret value must not be committed |

The Calico invariant is:

```text
kubeadm podSubnet
  == Calico Installation IPPool CIDR
  == 10.245.0.0/16
```

## Resource hierarchy

```text
Development cluster: 62.84.187.187
├── Control plane (on the same VPS/node)
│   ├── kube-apiserver       -> receives kubectl and controller requests
│   ├── etcd                 -> stores desired and actual cluster state
│   ├── kube-scheduler       -> selects a node for unscheduled Pods
│   └── controller-manager   -> reconciles desired state
│
└── Node: vmi3428783
    ├── kubelet              -> makes declared Pods run on this node
    ├── containerd           -> pulls images and runs containers
    ├── kube-proxy           -> implements Service forwarding
    ├── Calico               -> Pod IPs, routing and NetworkPolicy
    └── Pods
        ├── kube-system      -> CoreDNS, control-plane static Pods, metrics
        ├── calico-system    -> Calico networking components
        ├── argocd           -> GitOps controllers and UI/API
        ├── traefik          -> external HTTP/HTTPS entrypoint
        ├── cert-manager     -> certificate automation
        ├── local-path       -> local PersistentVolume provisioning
        └── apps-dev
            ├── web Deployment
            ├── api Deployment
            └── postgres StatefulSet + PVC
```

The VPS is both the control-plane node and the only worker node. This is a real
kubeadm cluster, but it is not highly available because every component shares
one machine and one failure domain.

## Request flow

```text
Browser
-> VPS port 80/443
-> Traefik
-> Gateway listener
-> HTTPRoute
   ├── /api -> api ClusterIP Service :3000 -> api Pod
   └── /    -> web ClusterIP Service :8080 -> web Pod

api Pod
-> postgres ClusterIP Service :5432
-> postgres Pod
```

`HTTPRoute` decides which Service receives an HTTP request. `ClusterIP` gives
that Service a stable internal endpoint and forwards to matching Pods. Neither
resource replaces the other.

## Deployment flow

```text
Ansible inventory + group_vars
-> SSH to the VPS
-> prepare Ubuntu, containerd and Kubernetes packages
-> kubeadm initializes the control plane
-> Calico creates the Pod network
-> Ansible installs Argo CD and creates the root Application

GitHub repository
-> Argo CD detects a commit
-> root Application loads platform/argocd
-> child Applications install platform controllers
-> food-delivery-dev loads overlays/dev
-> Kubernetes reconciles Deployments, StatefulSet, Services and routes
```

Ansible owns host/bootstrap configuration. Argo CD owns resources declared in
Git after bootstrap, so application manifest updates need a Git push rather
than another Ansible run.

## Secret flow

```text
Ansible Vault password
-> decrypts group_vars/all/vault.yaml in memory
-> reads vault_postgres_password
-> application_secrets role creates Secret/database-credentials
-> PostgreSQL reads POSTGRES_PASSWORD
-> API reads DATABASE_PASSWORD
```

The base PostgreSQL StatefulSet references `database-credentials` with
`envFrom`; it does not contain the password. The Secret value stays outside
Git, while the workload manifest safely declares only the Secret name.

## Exposed ports

```text
80/tcp            -> Traefik HTTP entrypoint
443/tcp           -> Traefik HTTPS entrypoint
6443/tcp          -> Kubernetes API (administration)
Argo HTTPS NodePort -> temporary Argo CD access without a domain
```

All application Services (`web`, `api`, `postgres`) remain `ClusterIP` and are
not directly public. The current Argo CD NodePort can be read with:

```bash
kubectl get service argocd-server -n argocd
```

## Why Gateway API replaces Ingress

Community ingress-nginx was retired in March 2026. The lab uses Gateway API
Standard `v1.6.1` with Traefik as the controller:

```text
GatewayClass = infrastructure/controller selection
Gateway      = exposed listeners and route attachment policy
HTTPRoute    = application routing rules
Service      = stable backend endpoint
Pod          = actual workload
```

This separation also creates a useful architect boundary: platform teams own
GatewayClass/controller policy, while application teams own HTTPRoutes.

## Storage semantics

`local-path-provisioner` dynamically creates a local PersistentVolume. It makes
the PostgreSQL PVC schedulable but does not provide replication, snapshots,
capacity enforcement, or off-server durability.

```text
StatefulSet deletion -> PVC normally remains
Pod recreation       -> same PVC can be remounted on this node
VPS/disk loss         -> database is lost without external backup
```

A production service needs scheduled PostgreSQL backups copied to object
storage and tested restores. Adding replicas on the same VPS does not solve disk
or server failure.

## Security model

The foundation enables Secret encryption at rest in etcd. Application secrets
come from Ansible Vault and are created outside Git. Workloads enforce the Restricted Pod Security profile,
run without privilege escalation, drop Linux capabilities, avoid service account
tokens, and use RuntimeDefault seccomp.

Calico policies start with default-deny and then permit only:

```text
all Pods -> CoreDNS:53
Traefik namespace -> web:8080 and api:3000
api -> postgres:5432
```

The Argo CD application project cannot deploy outside `apps-dev`. The platform
project has cluster-scoped privileges because controllers need CRDs, RBAC,
StorageClass and GatewayClass resources; its source repositories are restricted.

## GitOps dependency order

```text
Kubernetes + Calico
-> Argo CD
-> Gateway API CRDs + local-path
-> Traefik + cert-manager + metrics-server
-> Gateway/HTTPRoute + application workloads
```

Child Applications use sync waves, automated retries, self-heal and prune-last.
Traefik and the demo app tolerate CRD discovery delay during first bootstrap.

## Remaining production gaps

The repo deliberately does not claim these are solved by one VPS:

```text
control-plane HA and etcd quorum
worker failure isolation
off-server PostgreSQL backups
off-server etcd/PKI/encryption-key backups
domain name and ACME ClusterIssuer
central logs, metrics retention and alerting
external secret manager
image signing and admission policy
```

These are the next architecture phases after the entire bootstrap runbook passes.
