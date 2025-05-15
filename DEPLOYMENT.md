# Deployment Guide for Cyber Prompt Builder

This document provides instructions for deploying the Cyber Prompt Builder application on Render.

## Prerequisites

Before deploying, ensure you have:

1. A [Render](https://render.com) account
2. Access to the GitHub repository containing the application code
3. API keys for the AI providers you plan to use (OpenAI, Claude, Gemini)

## Deployment Steps

### 1. Connect Your Repository to Render

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing the Cyber Prompt Builder application

### 2. Configure the Web Service

The repository includes a `render.yaml` file that will automatically configure most settings, but verify the following:

- **Name**: cyber-prompt-builder (or your preferred name)
- **Runtime**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### 3. Set Environment Variables

The following environment variables need to be set in the Render dashboard:

#### Required API Keys (Secret)
- `REACT_APP_PROVIDERS_OPENAI_API_KEY`: Your OpenAI API key
- `REACT_APP_PROVIDERS_CLAUDE_API_KEY`: Your Claude API key
- `REACT_APP_PROVIDERS_GEMINI_API_KEY`: Your Gemini API key

#### Optional Configuration
The following variables are pre-configured in the `render.yaml` file but can be overridden in the dashboard:

- `REACT_APP_APP_ENVIRONMENT`: Set to "production" by default
- `REACT_APP_PROVIDERS_DEFAULT_PROVIDER`: Set to "openai" by default
- `REACT_APP_AGENT_MAX_ITERATIONS`: Set to "3" by default
- `REACT_APP_AGENT_ENABLE_TASK_BREAKDOWN`: Set to "true" by default
- `REACT_APP_AGENT_ENABLE_ITERATION`: Set to "true" by default
- `REACT_APP_AGENT_ENABLE_CONTEXT_MEMORY`: Set to "true" by default
- `REACT_APP_PROMPT_BUILDER_MAX_TOKENS`: Set to "4096" by default
- `REACT_APP_PROMPT_BUILDER_TEMPERATURE`: Set to "0.7" by default
- `REACT_APP_TTS_ENABLED`: Set to "false" by default

### 4. Deploy the Application

1. Click "Create Web Service"
2. Render will automatically deploy your application using the configuration in `render.yaml`
3. Once the deployment is complete, you can access your application at the provided URL

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs for any errors. Common issues include:
   - Missing dependencies
   - TypeScript compilation errors
   - Environment variable issues

2. **Runtime Errors**: Check the application logs for any runtime errors.

3. **API Key Issues**: Ensure all required API keys are correctly set in the environment variables.

### Health Check Failures

If the health check fails, verify:
1. The server is running correctly
2. The `/health` endpoint is accessible
3. The server is listening on the correct port (should use `process.env.PORT`)

## Updating the Deployment

To update your deployment:
1. Push changes to your GitHub repository
2. Render will automatically detect the changes and redeploy the application

## Custom Domains

To use a custom domain:
1. Go to your web service in the Render dashboard
2. Click on "Settings"
3. Scroll down to "Custom Domains"
4. Follow the instructions to add and verify your domain

## Support

If you encounter any issues with the deployment, please:
1. Check the Render documentation: https://render.com/docs
2. Review the application logs in the Render dashboard
3. Contact the development team for assistance
