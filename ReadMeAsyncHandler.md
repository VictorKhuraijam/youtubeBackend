# AsyncHandler

```js
const asyncHandler = (requesthandler) => {
  return (req, res, next) => {
    Promise
    .resolve(requesthandler(req, res, next))
    .catch((err) => next(err))
  }
}
```

## Overview

`asyncHandler` is a utility function designed to handle errors in asynchronous middleware or route handlers in frameworks like Express.js. It ensures that errors are properly passed to Express’s error-handling middleware.

## Purpose of `asyncHandler`

The primary goal of `asyncHandler` is to:
- Catch errors from asynchronous code (which are not automatically caught by Express).
- Ensure errors are passed to Express’s error-handling middleware using `next(err)`.

## How It Works

### Step-by-Step Explanation:

1. **Input:**
   - `asyncHandler` takes a single argument, `requesthandler`, which is an asynchronous function (middleware or route handler).
   - This function is expected to return a `Promise`.

2. **Returned Function:**
   - `asyncHandler` returns a function: `(req, res, next) => { ... }`. This returned function is used as the actual middleware or route handler in Express.

3. **Using `Promise.resolve`:**
   - `Promise.resolve(requesthandler(req, res, next))` ensures that the `requesthandler` returns a Promise, even if it’s not already a Promise.
   - This is important because:
     - If `requesthandler` is asynchronous, it already returns a Promise.
     - If `requesthandler` is synchronous, `Promise.resolve` converts the result into a resolved Promise.

4. **Error Handling:**
   - `.catch((err) => next(err))` catches any errors that occur in the `requesthandler` function.
   - If an error is caught, it is passed to `next(err)`, which signals Express to invoke its error-handling middleware.

## Key Benefits

1. **Error Handling for Async Code:**
   - Express doesn’t automatically handle errors thrown in asynchronous functions. For example:

   ```js
   app.get('/example', async (req, res) => {
     const data = await someAsyncOperation(); // If this throws, Express doesn't catch it by default
     res.json(data);
   });
   ```

- Without `asyncHandler`, unhandled errors would result in unhandled Promise rejections.

- With `asyncHandler`, errors are caught and passed to `next`, ensuring they are handled by Express’s error-handling middleware.

2. **Cleaner Code**

Rather than writing `try-catch` for every asynchronous route, `asyncHandler` abstracts error handling into a reusable utility, simplifying your code and reducing repetition.

## Example Usage

   Without `asyncHandler` (Manual `try-catch`):

```js
    app.get('/example', async (req, res, next) => {
    try {
        const data = await someAsyncOperation();
        res.json(data);
    } catch (err) {
        next(err); // Pass error to Express error handler
    }
    });
```

   With `asyncHandler`:

```js
    app.get('/example', asyncHandler(async (req, res, next) => {
         const data = await someAsyncOperation();
         res.json(data);
        }));
```

### Fixed Version of the Code

The provided code had a minor syntax issue—the inner function wasn’t being explicitly returned. Here’s the fixed version:

```js

const asyncHandler = (requesthandler) => {
  return (req, res, next) => {  // Explicitly return the function
    Promise
      .resolve(requesthandler(req, res, next))
      .catch((err) => next(err));
  };
};

```

### How It Handles Errors

**Case 1: Success**

```js
asyncHandler(async (req, res, next) => {
  const data = await someAsyncOperation(); // Resolves successfully
  res.json(data); // Sends response
});

```

- Promise.resolve(requesthandler(req, res, next)) resolves successfully.
- No errors occur, so .catch is skipped.

**Case 2: Error**
```js

asyncHandler(async (req, res, next) => {
  const data = await someAsyncOperation(); // Throws an error
  res.json(data);
});

```

- Promise.resolve(requesthandler(req, res, next)) rejects due to the error.
- .catch((err) => next(err)) catches the error and passes it to next, triggering Express’s error handler.

## Summary

- `asyncHandler` wraps asynchronous route handlers to catch errors and pass them to Express’s error-handling middleware.

- It uses Promise.resolve and .catch for elegant, centralized error handling.

- Ensure the inner function (req, res, next) is explicitly returned for proper behavior.

### Additional Notes (Optional)
- `asyncHandler` is best used in applications with multiple asynchronous operations, such as database queries or third-party API calls.

- It ensures that even if an error is thrown in asynchronous functions, it is handled properly without causing the application to crash.
