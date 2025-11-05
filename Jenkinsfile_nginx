pipeline {
    agent any
        environment {
        REACT_ENV = credentials('react-env')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'auditreportstoreinfirestore', url: 'https://github.com/Mahmoud-Dayem/safetyplus-web.git'
            }
        }
       stage('Use Secret .env') {
            steps {
                withCredentials([file(credentialsId: 'react-env', variable: 'ENV_FILE')]) {
                    sh '''
                        echo "Copying .env file..."
                        cp "$ENV_FILE" .env
                        echo ".env ready"

                        echo "Check file exists:"
                        ls -l .env

                        echo "---- .env first line ----"
                        head -n 1 .env
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        // stage('Remove .env') {
        // steps {
        // sh 'rm -f .env'
        //     }
        //    }

        // stage('Archive Build') {
        //     steps {
        //         archiveArtifacts artifacts: 'build/**', fingerprint: true
        //     }
        // }
         stage('Deploy to NGINX Docker') {
            steps {
                sh '''
                CONTAINER_NAME=react-nginx

                # Ensure container exists
                docker ps --filter "name=$CONTAINER_NAME" | grep $CONTAINER_NAME

                # Copy new build to NGINX container
                docker exec $CONTAINER_NAME rm -rf /usr/share/nginx/html/*
                docker cp build/. $CONTAINER_NAME:/usr/share/nginx/html/

                echo "✅ Deployment finished"
                '''
            }
        }
    }
    
}
