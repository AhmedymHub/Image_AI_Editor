import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    '/',  // Public route
    '/api/webhooks/clerk',  // Public webhook route
    '/((?!.+\\.[\\w]+$|_next).*)',  // Matches all dynamic routes except static files
    '/(api|trpc)(.*)',  // Apply middleware to API routes
  ],
};


// import { clerkMiddleware } from "@clerk/nextjs/server";


// export default clerkMiddleware({

//   publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

//   secretKey: process.env.CLERK_SECRET_KEY,

// });



// export const config = {

//   matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],

// };