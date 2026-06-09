# Yandex Cloud: группа безопасности для ohmybudget-prod

MCP toolkit **не умеет** создавать security groups — только консоль или `yc` CLI.

## Правила (сайт публичный, SSH — только админ)

| Направление | Порт | CIDR | Назначение |
|-------------|------|------|------------|
| Ingress | 80 | `0.0.0.0/0` | HTTP → редирект HTTPS |
| Ingress | 443 | `0.0.0.0/0` | HTTPS сайт |
| Ingress | 22 | `YOUR_IP/32` | SSH админа |
| Egress | any | `0.0.0.0/0` | исходящий трафик |

## Консоль YC

1. **VPC** → **Группы безопасности** → **Создать** (`ohmybudget-prod-sg`, сеть `default`)
2. Добавить правила из таблицы выше
3. **Compute Cloud** → `ohmybudget-prod` → сеть → **Назначить группы безопасности** → выбрать `ohmybudget-prod-sg` (убрать default-sg с «any» ingress, если привязана)

## CLI (`yc init` один раз)

```bash
export ADMIN_SSH_CIDR="YOUR.IP.HERE/32"
export NETWORK_ID="enpfa67m57snqh22chil"
export INSTANCE_ID="fhmfi3a264aq8vpeurgg"

yc vpc security-group create \
  --name ohmybudget-prod-sg \
  --network-id "$NETWORK_ID" \
  --rule "description=http,direction=ingress,port=80,protocol=tcp,v4-cidrs=[0.0.0.0/0]" \
  --rule "description=https,direction=ingress,port=443,protocol=tcp,v4-cidrs=[0.0.0.0/0]" \
  --rule "description=ssh,direction=ingress,port=22,protocol=tcp,v4-cidrs=[$ADMIN_SSH_CIDR]" \
  --rule "description=egress,direction=egress,protocol=any,v4-cidrs=[0.0.0.0/0]"

SG_ID=$(yc vpc security-group get ohmybudget-prod-sg --format json | jq -r .id)
yc compute instance update-network-interface "$INSTANCE_ID" \
  --network-interface-index 0 \
  --security-group-ids "$SG_ID"
```

На ВМ дополнительно включён **UFW** (`deploy/harden-server.sh`) — второй слой, даже если SG в YC ещё default.
