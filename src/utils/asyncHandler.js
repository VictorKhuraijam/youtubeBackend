const asyncHandler = (requesthandler) => {
  return (req, res, next) => {
    Promise
    .resolve(requesthandler(req, res, next))
    .catch((err) => next(err))
  }
}


export {asyncHandler}





// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async() => {}

/* const asyncHandler = (func) => async(req, res, next) => {
    try {
      return await func(req, res, next)
    } catch (error) {
      res.status(error.code || 500).json({
        success: false,
        message: error.message
      })
    }
  }
    */
