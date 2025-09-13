IMAGE_NAME = knighttools/subscribe-manager
TAG = latest
PLATFORMS = linux/amd64,linux/arm64

.PHONY: build push release

# 本地构建(只构建当前架构，不推送)
build:
	docker build -t $(IMAGE_NAME):$(TAG) .

# 多架构构建并推送到 Docker Hub
push:
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(IMAGE_NAME):$(TAG) \
		--push .

# 一键发布
release: push
	@echo "✅ 已发布 $(IMAGE_NAME):$(TAG) 到 Docker Hub (支持 $(PLATFORMS))"
