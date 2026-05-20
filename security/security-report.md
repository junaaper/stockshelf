# StockShelf Security Report

## Tools Used
| Tool    | Purpose                        | Stage         |
|---------|--------------------------------|---------------|
| Trivy   | Vulnerability & secret scanning | CI Pipeline   |

## Trivy Scan Results (latest)

### Backend (requirements.txt)
| Library          | CVE            | Severity | Fixed Version |
|------------------|----------------|----------|---------------|
| python-jose      | CVE-2024-33663 | CRITICAL | 3.4.0         |
| python-multipart | CVE-2024-53981 | HIGH     | 0.0.18        |
| python-multipart | CVE-2026-24486 | HIGH     | 0.0.22        |
| python-multipart | CVE-2026-42561 | HIGH     | 0.0.27        |

## Remediation Plan
- Upgrade `python-jose` to >= 3.4.0
- Upgrade `python-multipart` to >= 0.0.27

## Security Best Practices Applied
- JWT tokens with expiry (30min access, 7day refresh)
- Passwords hashed with bcrypt
- Role-based access control (admin vs staff)
- Kubernetes Secrets for sensitive values
- No hardcoded credentials in source code
- Docker images scanned on every pipeline run

## Pipeline Security Gates
- Trivy scan runs on every commit with HIGH/CRITICAL threshold
- SonarQube quality gate must pass before Docker build
- Docker images scanned before push to registry
- Kubernetes secrets used for all sensitive values
