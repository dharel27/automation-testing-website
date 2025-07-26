import React from 'react';
import ErrorPage from './ErrorPage';

const ServerErrorPage: React.FC = () => {
  return (
    <ErrorPage
      statusCode={500}
      title="Internal Server Error"
      message="Something went wrong on our end. Our team has been notified and is working to fix the issue."
      showRetry={true}
    />
  );
};

export default ServerErrorPage;
