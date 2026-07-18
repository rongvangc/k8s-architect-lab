# K8s Architect Lab

Learning lab for Kubernetes architecture and production operations on a VPS.

Current focus: setup a single-node kubeadm Kubernetes cluster on Ubuntu VPS.

Development and production are modeled as separate clusters with separate
Ansible inventories. The purchased VPS `62.84.187.187` is currently the
development cluster. The production inventory is kept as a template for later.

```text
Ubuntu VPS
-> Ansible-managed containerd and host configuration
-> Ansible-managed kubeadm/kubelet/kubectl
-> Ansible-managed Calico bootstrap
-> Argo CD
   -> local-path storage
   -> Gateway API + Traefik
   -> cert-manager + metrics-server
   -> demo application
```

## Important Files

```text
ansible/
├── playbooks/site.yaml
├── inventories/development/
├── inventories/production/
└── roles/
docs/
├── bootstrap-ubuntu-vps.md
└── vps-kubernetes-foundation.md
```

## VPS Setup

Read `docs/vps-kubernetes-foundation.md` for the architecture, then follow
`docs/bootstrap-ubuntu-vps.md` on the VPS.

Run from the Mac control machine:

```bash
cd ansible
ansible-playbook -i inventories/development/hosts.yaml \
  playbooks/site.yaml --ask-vault-pass
```

Ansible owns the host and first cluster bootstrap. Argo CD owns the platform and applications after bootstrap.

Ansible is a reusable control-machine tool, not a package installed into only
this VPS. Use `-i inventories/<environment>/hosts.yaml` to select the target
environment or another project's inventory.
