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
       stage('Create .env file') {
            steps {
                sh '''
                  echo "$REACT_ENV" > .env
                  echo ".env file created"
                  echo "---- .env content ----"
                  cat .env
                '''
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
