# VPS Kubernetes Foundation

## Architecture

```text
Internet
├── 62.84.187.187:6443 -> kube-apiserver
├── 62.84.187.187:80   -> Traefik hostPort
└── 62.84.187.187:443  -> Traefik hostPort
                              |
Ubuntu VPS                    v
├── containerd          Gateway API
├── kubelet             ├── GatewayClass: traefik
├── control plane       ├── Gateway: architect-lab
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
        └── apps-prod only
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
| application resources | Argo CD app project | isolated to `apps-prod` |
| live database password | cluster Secret | secret value must not be committed |

The Calico invariant is:

```text
kubeadm podSubnet
  == Calico Installation IPPool CIDR
  == 10.244.0.0/16
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

The Argo CD application project cannot deploy outside `apps-prod`. The platform
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
