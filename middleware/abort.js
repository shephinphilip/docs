import statsd from '#src/observability/lib/statsd.js';

export default function abort(req, res, next) {
  // If the client aborts the connection, send an error
  req.once('aborted', async () => {
    // Ignore aborts from next, usually has to do with webpack-hmr
    if (req.path.startsWith('/_next')) {
      return;
    }

    try {
      // NOTE: Node.js will also automatically set `req.aborted = true`

      const incrementTags = [];
      // Be careful with depending on attributes set on the `req` because
      // under certain conditions the contextualizers might not yet have
      // had a chance to run.
      if (req.pagePath) {
        incrementTags.push(`path:${req.pagePath}`);
      }
      if (req.context?.currentCategory) {
        incrementTags.push(`product:${req.context.currentCategory}`);
      }

      // Simulate asynchronous operation (e.g., fetching data)
      await someAsyncOperation();

      statsd.increment('middleware.abort', 1, incrementTags);

      const abortError = new Error('Client closed request');
      abortError.statusCode = 499;
      abortError.code = 'ECONNRESET';

      // Pass the error to the Express error handler
      return next(abortError);
    } catch (error) {
      // Handle any unexpected errors gracefully
      console.error('Error in abort middleware:', error);
      // You can choose to pass the error to the Express error handler here
      // or take appropriate action based on your project's requirements.
    }
  });

  return next();
}

// Simulate an async operation
async function someAsyncOperation() {
  return new Promise((resolve) => {
    setTimeout(resolve, 100); // Simulating a delay
  });
}
