
import { envMode } from "../app.js";
  
export const errorMiddleware = (
  err,
  req,
  res,
  // eslint-disable-next-line no-unused-vars
  next
)=> {
  
  err.message||= "Internal Server Error";
  err.statusCode = err.statusCode || 500;
  
  // Log error details in development
  if (envMode === "DEVELOPMENT") {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
  }
    
  const response = {
    success: false,
    message: err.message,
  };
  
  if (envMode === "DEVELOPMENT") {
    response.error = {
      message: err.message,
      stack: err.stack,
      ...err
    };
  }
  
  return res.status(err.statusCode).json(response);
  
};
  
export const TryCatch = (passedFunc) => async (req, res, next) => {
 try {
    await passedFunc(req, res, next);
 } catch (error) {
    next(error);
   }
};
  
  
  