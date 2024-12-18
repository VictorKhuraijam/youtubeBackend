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

<br><br><br><br>



# ApiError

**What is a Stack Trace?**

- A stack trace is a detailed report of the function calls that led to a specific point in the execution of a program.
- It is primarily used for debugging and shows:
  - The sequence of method/function calls at the time the error occurred.
  - The exact file name and line number for each call in the chain.



For example, when an error occurs, the stack trace might look like this:

```js
Error: User not found
    at getUser (app.js:23)
    at fetchUserDetails (app.js:15)
    at main (app.js:30)
    at Object.<anonymous> (app.js:35)
```

Here:

- getUser, fetchUserDetails, and main are functions in the program.
- Each line indicates where the error occurred, helping developers trace  the issue back to its source.

**Stack Management in** `ApiError`

 In your custom error class, the stack is either explicitly set or captured automatically:

```js
if (stack) {
  this.stack = stack;
} else {
  Error.captureStackTrace(this, this.constructor);
}
```
**1. Custom Stack Trace** (`stack`):

- If a stack trace is explicitly passed to the constructor, it is assigned to the error object (`this.stack = stack;`).
- This is useful if you want to propagate or customize an error's stack trace (e.g., when wrapping errors).

**2. Automatic Stack Trace** (`Error.captureStackTrace`):

- If no stack is provided, the built-in `Error.captureStackTrace` generates one.
- The `Error.captureStackTrace(this, this.constructor)` ensures the stack trace:
  - Starts from where the ApiError was created.
  - Excludes the constructor itself from the trace, focusing only on the relevant calls.

The stack property of the error object can then be logged or displayed for debugging.

### `this.data` in `ApiError`

**What does `this.data` Represent?**

In the ApiError class, this.data is initialized as null:

```js
this.data = null;
```

The property is reserved for **custom additional information** that might be relevant to the error but doesn't fit into the standard `message`, `statusCode`, or `errors` fields.

**Possible Uses of** `this.data`:

**1. Dynamic Contextual Information:**

- It can store dynamic data related to the error, such as:
  - The current state of a variable.
  - A partial result that caused the failure.
- Example:
```js
throw new ApiError(500, "Database query failed", [], { query: "SELECT * FROM users WHERE id=1" });
```

**2. API Response Data:**

- In some cases, you might want to return structured data back to the client to help them understand and debug the error:
```js
const error = new ApiError(422, "Validation failed");
error.data = { field: "email", issue: "Invalid format" };
throw error;
```

**3. Logging:**

- `this.data` can hold additional details that aren't shown to the user but are useful for logging:
```js
const error = new ApiError(503, "Service Unavailable");
error.data = { service: "UserService", retryAfter: 30 }; // Log internally
throw error;
```

**Practical Example:**
Here's how `this.data` might be used in a real-world scenario:
```js
async function fetchDataFromAPI(url) {
  if (!url) {
    const error = new ApiError(400, "URL is required");
    error.data = { providedUrl: url };
    throw error;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = new ApiError(response.status, "Failed to fetch data");
      error.data = { url, statusText: response.statusText };
      throw error;
    }
    return response.json();
  } catch (err) {
    throw new ApiError(500, "Unexpected error occurred", [], err.stack);
  }
}
```

- When the client-side application receives the error, the `data` field could help pinpoint the issue (e.g., invalid URL, incorrect API endpoint).

### Comparison of Key Properties

|Property	 |Purpose	  |Example      |
|----------|----------|-------------|
|`statusCode`	|HTTP status code that represents the error.	`|404 for "Not Found".|
|`message`	|A human-readable message describing the error.	|`"User not found"`.|
|`errors`	|An array of additional error details, useful for validation or compound errors.	|["Invalid email format"].|
|`stack`	|A trace of function calls leading to the error (debugging only).	|Function call chain with file/line numbers.|
|`data`	|Custom data associated with the error, providing additional context.	|{ query: "SELECT * FROM users" }.|

By combining these properties, `ApiError` provides a comprehensive way to represent errors with all the information needed for handling and debugging.
