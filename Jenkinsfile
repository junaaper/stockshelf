pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'junaaper'
        IMAGE_BACKEND  = "${DOCKERHUB_USERNAME}/stockshelf-backend"
        IMAGE_FRONTEND = "${DOCKERHUB_USERNAME}/stockshelf-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/junaaper/stockshelf.git'
            }
        }

        stage('Install & Test Backend') {
            steps {
                sh '''
                    docker run --rm \
                        -v $(pwd)/backend:/app \
                        -w /app \
                        python:3.11-slim \
                        pip install -r requirements.txt --quiet
                    echo "Backend dependencies verified successfully"
                '''
            }
        }

        stage('Security Scan - Trivy Filesystem') {
            steps {
                sh '''
                    if ! command -v trivy &> /dev/null; then
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
                    fi
                    trivy fs --exit-code 0 --severity HIGH,CRITICAL \
                        --format table ./backend
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
                    cd /home/ubuntu/stockshelf
                    docker compose pull
                    docker compose up -d --force-recreate
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
