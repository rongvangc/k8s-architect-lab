# Bootstrap Ubuntu VPS With Ansible

This is the only host-bootstrap runbook. Ansible runs on the Mac control machine
and manages the Ubuntu VPS `62.84.187.187` over SSH. Kubernetes itself runs only
on the VPS.

## Architecture boundary

```text
Mac / CI runner
└── Ansible
    ├── Ubuntu, kernel and containerd
    ├── kubeadm, kubelet and kubectl
    ├── Kubernetes control plane and Calico
    ├── encrypted application Secret
    └── first Argo CD installation

Git repository
└── Argo CD
    ├── Gateway API and Traefik
    ├── storage, cert-manager and metrics-server
    └── application workloads
```

There are no shell bootstrap scripts. `ansible/playbooks/site.yaml` is the
entrypoint; the selected inventory decides which environment is configured.

## Environments

Infrastructure environments use separate Ansible inventories:

```text
ansible/inventories/development
ansible/inventories/production
```

Run development explicitly (the active environment):

```bash
ansible-playbook -i inventories/development/hosts.yaml \
  playbooks/site.yaml --ask-vault-pass
```

The production inventory is a template only. Do not run it until a separate
production VPS is available and its values have been replaced:

```bash
ansible-playbook -i inventories/production/hosts.yaml \
  playbooks/site.yaml --ask-vault-pass
```

The environments are separated at two levels:

```text
Infrastructure
├── development inventory -> a dedicated development cluster
└── production inventory  -> template for a future production cluster

Application manifests
├── overlays/dev  -> namespace apps-dev, image tag dev
└── overlays/prod -> namespace apps-prod, versioned image tags
```

The current root Argo CD Application is used for the active development
cluster. The production inventory and overlay remain templates until a separate
production cluster exists.

Do not treat `apps-dev` and `apps-prod` namespaces on one cluster as production
isolation. They share the same API server, nodes, networking failure domain and
cluster administrators. Namespaces are useful boundaries inside one cluster;
separate clusters are the environment boundary used by this repository.

## 1. Prepare SSH

```bash
ssh-keygen -t ed25519 -C "k8s-architect-lab"
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@62.84.187.187
ssh root@62.84.187.187
```

The final command must connect successfully using the SSH key. Restrict TCP 22
and 6443 to your own public IP at the VPS provider firewall. Allow public TCP 80
and 443 for applications. Never expose etcd `2379-2380` or kubelet `10250`.

## 2. Install control-machine tools

```bash
brew install ansible ansible-lint
ansible --version
```

Ansible is not installed on the target VPS. Ubuntu only needs SSH and Python.

## Ansible as a shared control tool

Ansible is installed once on the control machine, for example your Mac or a
dedicated administration VPS. It can manage many unrelated VPSs and clusters;
the target is selected by the inventory passed to each command.

```text
Control machine
├── this project / ansible.cfg
├── development inventory -> DEV VPS 62.84.187.187
├── production inventory  -> future PROD VPS
└── other-project inventory -> another VPS or cluster
```

The repository's `ansible.cfg` defaults to the active development inventory:

```ini
inventory = inventories/development/hosts.yaml
```

That default is only a convenience. Use `-i` explicitly when operating more
than one environment:

```bash
# This project's DEV VPS
ansible-playbook -i inventories/development/hosts.yaml \
  playbooks/site.yaml --ask-vault-pass

# This project's future PROD VPS
ansible-playbook -i inventories/production/hosts.yaml \
  playbooks/site.yaml --ask-vault-pass
```

To inspect or test a target without changing it:

```bash
ansible-inventory -i inventories/development/hosts.yaml --graph
ansible -i inventories/development/hosts.yaml kubernetes \
  -m ansible.builtin.ping
```

For another project, keep its inventory and variables in that project's
directory and select it explicitly:

```bash
ansible-playbook -i ../billing-platform/ansible/inventories/staging/hosts.yaml \
  ../billing-platform/ansible/playbooks/site.yaml
```

Ansible does not permanently bind to the VPS where it was first used. The
inventory, SSH credentials and variables determine the target. Keep each
project's inventories separate, use different Vault files per environment,
and avoid putting passwords or private keys in `hosts.yaml`.

## What ansible-lint does

`ansible-lint` is a static quality checker for Ansible YAML. It reads playbooks,
roles and task files without connecting to the VPS and reports patterns that
are invalid, ambiguous, insecure or difficult to maintain.

It is different from the other checks:

```text
ansible-playbook --syntax-check
└── YAML/playbook structure is valid

ansible-lint
└── Ansible style, reliability and security rules are followed

ansible-playbook --check
└── Predict what would change on the remote VPS

ansible-playbook
└── Actually change the remote VPS
```

Run it from the `ansible` directory before applying changes:

```bash
ansible-lint playbooks/site.yaml
```

To lint the complete Ansible project:

```bash
ansible-lint .
```

Typical findings include using a shell command where an Ansible module exists,
missing file modes, an unqualified module name, a task without a useful name,
or a task that may report `changed` every time it runs. For example, prefer:

```yaml
- name: Install containerd
  ansible.builtin.apt:
    name: containerd
    state: present
    update_cache: true
```

over an unqualified or non-idempotent task such as:

```yaml
- name: Install containerd
  shell: apt-get install -y containerd
```

Do not silence a rule just to make the command pass. Fix the task first. If a
shell or command is genuinely required, add a short `# noqa: rule-id` only on
that task and document why it cannot use a module. Lint is safe to run on the
production template because it does not execute anything remotely.

## 3. Configure repository values

Edit the inventory files before the first run:

```text
ansible/inventories/<environment>/hosts.yaml
ansible/inventories/<environment>/group_vars/all/main.yaml
platform/apps/food-delivery/overlays/prod/kustomization.yaml
```

For a development cluster, edit the development inventory and
`platform/apps/food-delivery/overlays/dev/kustomization.yaml` instead. Do not put a
development VPS address in the production inventory.

DEV currently enables GitOps bootstrap, so `git_repo_url` must point to the
pushed repository before running `site.yaml`:

```yaml
# ansible/inventories/development/group_vars/all/main.yaml
gitops_bootstrap_enabled: true
git_repo_url: https://github.com/YOUR_USER/k8s-architect-lab.git
```

The Argo CD `Application` manifests under `platform/argocd/applications/` also
use this repository URL directly. Keep them in sync when you fork or rename the
GitHub repository.

Replace `REPLACE_WITH_GITHUB_USER` in the production Kustomize overlay with the
registry owner that contains the built API and web images. Commit and push these
changes before Argo CD starts.

## 4. Create encrypted Ansible variables

```bash
cd ansible/inventories/development/group_vars/all
cp vault.example.yaml vault.yaml
ansible-vault encrypt vault.yaml
cd ../../../..
```

Edit the value when Ansible Vault opens the file:

```yaml
vault_postgres_password: use-a-long-random-password-here
vault_github_token: github_pat_or_fine_grained_token_here
```

`vault.yaml` and `.vault-password` are ignored by Git. For a team workflow, an
encrypted Vault file may be committed, but its vault password must remain in a
password manager or CI secret store.

`vault_github_token` is used by Argo CD Image Updater. For this lab it needs
write access to `rongvangc/k8s-architect-lab` and read access to GHCR packages.
The token is not stored in Kubernetes YAML. Ansible creates these runtime
Secrets in the `argocd` namespace:

```text
argocd-image-updater-git-creds  -> Git write-back
argocd-image-updater-ghcr-creds -> GHCR tag discovery
```

## 5. Verify inventory and connectivity

```bash
cd ansible
ansible-inventory --graph
ansible all -m ping
ansible all -a 'hostname && free -h && df -h'
```

Expected inventory:

```text
@all
└── @kubernetes
    └── @control_plane
        └── control-plane-1
```

## 6. Validate before changing the development cluster

```bash
ansible-playbook -i inventories/development/hosts.yaml playbooks/site.yaml --syntax-check
ansible-lint playbooks/site.yaml
ansible-playbook -i inventories/development/hosts.yaml playbooks/site.yaml --check --ask-vault-pass
```

Check mode cannot perfectly predict `kubeadm` and `kubectl` operations on a new
cluster, but it validates inventory, variables, package tasks and templates.

## 7. Provision the cluster

```bash
ansible-playbook -i inventories/development/hosts.yaml playbooks/site.yaml --ask-vault-pass
```

The playbook executes these roles in order:

```text
common
-> containerd
-> kubernetes_packages
-> control_plane
-> application_secrets
-> argocd
```

Run it a second time to verify idempotency:

```bash
ansible-playbook -i inventories/development/hosts.yaml playbooks/site.yaml --ask-vault-pass
```

The second recap should be mostly `ok` with `failed=0`. A `changed` result is
acceptable only when a remote manifest or desired configuration really changed.

To prepare only the operating system:

```bash
ansible-playbook playbooks/prepare-os.yaml
```

## 8. Verify Kubernetes and GitOps

```bash
ssh root@62.84.187.187
export KUBECONFIG=/etc/kubernetes/admin.conf

kubectl get nodes -o wide
kubectl get pods -A
kubectl get tigerastatus
kubectl get applications -n argocd
kubectl get storageclass
kubectl get gatewayclass
kubectl get imageupdaters -n argocd
kubectl get gateway,httproute -n apps-dev
kubectl get pvc,pods -n apps-dev
kubectl get networkpolicy -n apps-dev
kubectl top nodes
```

Test the public route:

```bash
curl -i http://62.84.187.187/health
curl -i http://62.84.187.187/api/info
```

## Recovery material

Back up these files off-server and never commit them:

```text
/etc/kubernetes/pki/
/etc/kubernetes/encryption-config.yaml
/etc/kubernetes/admin.conf
```

Also configure off-server PostgreSQL and etcd backups before treating the VPS
as a real production workload. One VPS remains one failure domain.

## Troubleshooting

Use Ansible verbose output first:

```bash
ansible-playbook playbooks/site.yaml --ask-vault-pass -vv
```

Then inspect the target without making persistent manual changes:

```bash
ansible control_plane -a 'systemctl status containerd kubelet --no-pager'
ansible control_plane -a 'journalctl -u kubelet -n 100 --no-pager'
```

Manual emergency fixes must be represented back in Ansible afterward, otherwise
the server develops configuration drift.
