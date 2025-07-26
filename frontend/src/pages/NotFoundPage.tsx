import React from 'react';
import ErrorPage from './ErrorPage';

const NotFoundPage: React.FC = () => {
  return (
    <ErrorPage
      statusCode={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved. Please check the URL and try again."
      showRetry={false}
    />
  );
};

export default NotFoundPage;
