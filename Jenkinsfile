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

        stage('Archive Build') {
            steps {
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }
    }
}
