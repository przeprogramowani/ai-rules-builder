import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Infrastructure library rules (CI/CD, Containerization, Cloud)
 */
export const infrastructureRules: LibraryRulesMap = {
  // CI/CD libraries
  [Library.GITHUB_ACTIONS]: [
    'Use actions/checkout@v4 to checkout code',
    'Use actions/setup-node@v4 to setup Node.js',
    'Use actions/setup-python@v5 to setup Python',
    'Use actions/setup-java@v4 to setup Java',
    'Use actions/setup-go@v5 to setup Go',
    'Use composite actions to reuse workflow steps across different workflows',
    'Implement caching for dependencies to speed up builds',
    'Use matrix builds for testing across {{platform_versions}}',
  ],
  [Library.JENKINS]: [
    'Use declarative pipelines with Jenkinsfile instead of freestyle jobs',
    'Implement shared libraries for common pipeline steps',
    'Use agents and labels for distributing builds across {{environment_types}}',
  ],
  [Library.GITLAB_CI]: [
    'Use includes to reuse configuration across multiple pipelines',
    'Implement caching for dependencies to speed up builds',
    'Use rules and only/except to control when jobs run based on {{branch_patterns}}',
  ],

  // Containerization libraries
  [Library.DOCKER]: [
    'Use multi-stage builds to create smaller production images',
    'Implement layer caching strategies to speed up builds for {{dependency_types}}',
    'Use non-root users in containers for better security',
  ],
  [Library.KUBERNETES]: [
    'Use Helm charts for packaging and deploying applications',
    'Implement resource requests and limits for all containers based on {{workload_characteristics}}',
    'Use namespaces to organize and isolate resources',
  ],

  // Cloud libraries
  [Library.AWS]: [
    'Use Infrastructure as Code (IaC) with AWS CDK or CloudFormation',
    'Implement the principle of least privilege for IAM roles and policies',
    'Use managed services when possible instead of maintaining your own infrastructure for {{service_types}}',
  ],
  [Library.AZURE]: [
    'Use Azure Resource Manager (ARM) templates or Bicep for infrastructure as code',
    'Implement Azure AD for authentication and authorization of {{user_types}}',
    'Use managed identities instead of service principals when possible',
  ],
  [Library.GCP]: [
    'Use Terraform or Deployment Manager for infrastructure as code',
    'Implement VPC Service Controls for network security around {{sensitive_services}}',
    'Use workload identity for service-to-service authentication',
  ],
};
