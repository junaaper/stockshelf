pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'junaaper'
        IMAGE_BACKEND  = "${DOCKERHUB_USERNAME}/stockshelf-backend"
        IMAGE_FRONTEND = "${DOCKERHUB_USERNAME}/stockshelf-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = 'stockshelf'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/junaaper/stockshelf.git'
            }
        }

        stage('Verify Source') {
            steps {
                sh '''
                    echo "=== Backend structure ==="
                    ls backend/
                    echo "=== Dependencies ==="
                    cat backend/requirements.txt
                    echo "=== Frontend structure ==="
                    ls frontend/
                    echo "Source verification passed"
                '''
            }
        }

        stage('Code Quality - SonarQube') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    withEnv(["PATH+SONAR=${tool 'sonarqube-scanner'}/bin"]) {
                        sh '''
                            sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.projectName=StockShelf \
                                -Dsonar.sources=backend/app,frontend/src \
                                -Dsonar.host.url=http://172.31.21.46:9000
                        '''
                    }
                }
            }
        }

        stage('Security Scan - Trivy Filesystem') {
            steps {
                sh '''
                    if ! command -v trivy &> /dev/null; then
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    fi
                    trivy fs --exit-code 0 --severity HIGH,CRITICAL --format table ./backend
                '''
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build -t ${IMAGE_BACKEND}:${IMAGE_TAG} ./backend
                    docker build -t ${IMAGE_FRONTEND}:${IMAGE_TAG} ./frontend
                    docker tag ${IMAGE_BACKEND}:${IMAGE_TAG} ${IMAGE_BACKEND}:latest
                    docker tag ${IMAGE_FRONTEND}:${IMAGE_TAG} ${IMAGE_FRONTEND}:latest
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '''
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                    docker push ${IMAGE_BACKEND}:${IMAGE_TAG}
                    docker push ${IMAGE_BACKEND}:latest
                    docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}
                    docker push ${IMAGE_FRONTEND}:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cat > .env << ENVEOF
POSTGRES_DB=stockshelf
POSTGRES_USER=stockshelf_user
POSTGRES_PASSWORD=stockshelf_pass
DATABASE_URL=postgresql://stockshelf_user:stockshelf_pass@db:5432/stockshelf
JWT_SECRET=supersecretjwtkey_changeinproduction
ENVEOF
                    docker compose -f docker-compose.yml pull
                    docker compose -f docker-compose.yml up -d --force-recreate
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
        always {
            sh 'docker logout'
        }
    }
}
