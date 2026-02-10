# Quantum Service - 本地测试指南

本文档介绍如何在本地环境测试量子密钥生成 Lambda 函数。

> **注意**: 此包命名为 `quantum_service` 而非 `braket`，以避免与 `amazon-braket-sdk` 冲突。

## 目录

- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [测试方法](#测试方法)
- [AWS 配置（可选）](#aws-配置可选)
- [测试用例](#测试用例)
- [故障排除](#故障排除)

---

## 环境准备

### 系统要求

- Python 3.10+
- uv 包管理器（推荐）或 pip

### 安装依赖

```bash
# 进入项目目录
cd /path/to/qc-bc-interactive/src

# 使用 uv 安装依赖（推荐）
uv sync

# 或使用 pip
pip install -r requirements.txt
```

### 可选依赖

如需完整的 AWS Braket 支持，需要安装额外依赖：

```bash
# 安装 Braket SDK（用于本地模拟器和 AWS 设备）
uv add amazon-braket-sdk

# 安装 numpy（用于 QuEra Aquila AHS 支持）
uv add numpy
```

---

## 快速开始

### 方式一：直接运行测试脚本

```bash
cd /path/to/qc-bc-interactive/src
uv run python lambda_quantum_keys.py
```

预期输出：
```
============================================================
Quantum Key Generator - Local Test
============================================================

[Test 1] Basic signature generation with local simulator...
Status Code: 200
Success: True
Quantum Number: 33
Device: Local Simulator
Algorithm: ToyLWE-Quantum-Seeded-Demo

[Test 2] List available devices...
Total devices: 6
  - local_simulator: Local Simulator (Always Available)
  - aws_sv1: AWS SV1 Simulator (Requires AWS Configuration)
  ...

============================================================
Tests completed!
============================================================
```

### 方式二：Python 交互式测试

```bash
cd /path/to/qc-bc-interactive/src
uv run python
```

```python
import json
from lambda_quantum_keys import handler

# 构造测试请求
event = {
    'body': json.dumps({
        'device': 'local_simulator',
        'name': 'Test User',
        'message': 'Hello Quantum'
    })
}

# 调用 handler
result = handler(event, None)

# 解析响应
response = json.loads(result['body'])
print(json.dumps(response, indent=2))
```

---

## 项目结构

```
src/
├── lambda_quantum_keys.py   # Lambda 入口点
├── test_braket.py           # 自动化测试脚本
└── quantum_service/         # 量子服务包
    ├── __init__.py          # 包导出
    ├── credentials.py       # AWS IAM/STS 凭证管理
    ├── devices.py           # 量子设备配置
    ├── crypto.py            # 后量子密码学 (ToyLWE)
    ├── quantum_service.py   # 核心量子服务
    ├── handlers.py          # Lambda 处理器
    └── README.md            # 本文档
```

---

## 测试方法

### 1. 测试量子签名生成

```python
import json
from lambda_quantum_keys import handler

def test_signature_generation():
    """测试基本签名生成"""
    event = {
        'body': json.dumps({
            'device': 'local_simulator',
            'name': 'Alice',
            'message': 'My quantum signature',
            'timeframe': '2024'
        })
    }

    result = handler(event, None)
    response = json.loads(result['body'])

    assert result['statusCode'] == 200
    assert response['success'] == True
    assert 'quantum_number' in response
    assert 'signature' in response
    assert 'public_key' in response

    print(f"✓ Quantum Number: {response['quantum_number']}")
    print(f"✓ Signature: {response['signature'][:50]}...")
    print(f"✓ Algorithm: {response['algorithm']}")

    return response

# 运行测试
test_signature_generation()
```

### 2. 测试设备列表

```python
import json
from lambda_quantum_keys import handler_devices

def test_list_devices():
    """测试设备列表获取"""
    result = handler_devices({}, None)
    response = json.loads(result['body'])

    assert result['statusCode'] == 200
    assert response['success'] == True
    assert 'devices' in response

    print(f"Available devices ({response['device_count']}):")
    for device_id, info in response['devices'].items():
        status = info.get('status', 'Unknown')
        print(f"  - {device_id}: {info['name']} [{status}]")

    return response

# 运行测试
test_list_devices()
```

### 3. 运行完整测试套件

```bash
cd /path/to/qc-bc-interactive/src
uv run python test_braket.py
```

可用测试参数：
```bash
uv run python test_braket.py --test all        # 所有测试
uv run python test_braket.py --test signature  # 签名生成
uv run python test_braket.py --test devices    # 设备列表
uv run python test_braket.py --test crypto     # 密钥生成
uv run python test_braket.py --quiet           # 安静模式
```

---

## AWS 配置（可选）

如需使用真实的 AWS Braket 设备，需要配置 AWS 凭证。

### 方式一：使用 AWS CLI 配置

```bash
# 配置 AWS 凭证
aws configure

# 验证配置
aws sts get-caller-identity
```

### 方式二：使用环境变量

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### 方式三：跨账户角色假设

如需访问其他账户的 Braket 资源：

```bash
# 设置要假设的角色 ARN
export BRAKET_ASSUME_ROLE_ARN="arn:aws:iam::123456789012:role/BraketAccessRole"

# 可选：设置外部 ID
export BRAKET_EXTERNAL_ID="your-external-id"
```

### IAM 权限要求

Lambda 执行角色需要以下权限：

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "braket:SearchDevices",
                "braket:GetDevice",
                "braket:CreateQuantumTask",
                "braket:GetQuantumTask",
                "braket:CancelQuantumTask"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::amazon-braket-*/*"
        }
    ]
}
```

---

## 故障排除

### 问题 1: 模块导入错误

```
ModuleNotFoundError: No module named 'quantum_service'
```

**解决方案**：确保在 `src` 目录下运行，或将 `src` 添加到 Python 路径：

```python
import sys
sys.path.insert(0, '/path/to/qc-bc-interactive/src')
```

### 问题 2: braket 包名冲突

```
ImportError: cannot import name 'handler' from 'braket'
```

**原因**：旧版本使用 `braket` 作为包名，与 `amazon-braket-sdk` 冲突。

**解决方案**：已重命名为 `quantum_service`，更新导入：

```python
# 旧方式（不再使用）
# from braket.handlers import handler

# 新方式
from quantum_service.handlers import handler
```

### 问题 3: AWS 权限错误

```
AccessDeniedException: User is not authorized to perform: braket:SearchDevices
```

**解决方案**：
1. 确保 IAM 角色有 Braket 权限
2. 或者忽略此错误，继续使用本地模拟

### 问题 4: Lambda 部署后找不到模块

确保部署包包含 `quantum_service` 目录：

```bash
# 创建部署包
cd src/
zip -r ../lambda_deployment.zip lambda_quantum_keys.py quantum_service/
```

---

## 性能基准

本地模拟器性能参考：

| 操作 | 平均耗时 |
|------|----------|
| 签名生成 (8 量子比特) | ~20ms |
| Bell 态测量 (100 shots) | ~10ms |
| 密钥对生成 | ~5ms |
| 完整签名流程 | ~50ms |

---

## 更多资源

- [AWS Braket 文档](https://docs.aws.amazon.com/braket/)
- [Amazon Braket SDK](https://github.com/amazon-braket/amazon-braket-sdk-python)
- [Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
