#!/bin/bash

# Deploy script para Aurora App no Kubernetes

echo "🚀 Iniciando deploy da Aurora App no Kubernetes..."

# Função para verificar se o comando foi executado com sucesso
check_command() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ Erro: $1"
        exit 1
    fi
}

# 1. Build das imagens Docker
echo "📦 Fazendo build das imagens..."
docker build -t aurora-api:latest ./api
check_command "Build da API concluído"

docker build -t aurora-client:latest ./client
check_command "Build do Client concluído"

# 2. Aplicar manifestos do Kubernetes
echo "🔧 Aplicando manifestos do Kubernetes..."
kubectl apply -f k8s-manifests.yaml
check_command "Manifestos aplicados"

# 3. Aguardar pods ficarem prontos
echo "⏳ Aguardando pods ficarem prontos..."
kubectl wait --for=condition=ready pod -l app=aurora-api -n aurora-app --timeout=300s
check_command "Pods da API prontos"

kubectl wait --for=condition=ready pod -l app=aurora-client -n aurora-app --timeout=300s
check_command "Pods do Client prontos"

# 4. Verificar status dos deployments
echo "📊 Status dos deployments:"
kubectl get deployments -n aurora-app
kubectl get services -n aurora-app
kubectl get pods -n aurora-app

# 5. Configurar port-forward para testes locais
echo "🌐 Configurando port-forward para testes..."
echo "Para acessar a aplicação localmente:"
echo "  Frontend: kubectl port-forward -n aurora-app svc/aurora-client-service 3000:80"
echo "  API: kubectl port-forward -n aurora-app svc/aurora-api-service 8080:8080"

# 6. Informações de acesso
echo "📝 Informações de acesso:"
echo "  Namespace: aurora-app"
echo "  Frontend URL: http://aurora.local (configure o /etc/hosts)"
echo "  API URL: http://aurora.local/api"

echo "✅ Deploy concluído com sucesso!"
