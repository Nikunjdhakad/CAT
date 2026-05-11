/**
 * Examples of using requireAuth and requireRole middleware
 * 
 * This file demonstrates how to use the role-based authorization middleware
 * in different route configurations.
 */

import { Router } from "express";
import type { Env } from "../env.js";
import { requireAuth, requireRole } from "./auth.js";

/**
 * Example 1: Vendor-only routes
 * Only users with the 'vendor' role can access these routes
 */
export function createVendorRouter(env: Env) {
  const router = Router();
  
  // Apply authentication and vendor role requirement to all routes
  router.use(requireAuth(env), requireRole("vendor"));

  router.get("/profile", (req, res) => {
    // Only vendors can access this
    res.json({ message: "Vendor profile", userId: req.auth?.userId });
  });

  router.post("/menu", (req, res) => {
    // Only vendors can create menu items
    res.json({ message: "Menu item created" });
  });

  return router;
}

/**
 * Example 2: Admin-only routes
 * Only users with the 'admin' role can access these routes
 */
export function createAdminRouter(env: Env) {
  const router = Router();
  
  // Apply authentication and admin role requirement to all routes
  router.use(requireAuth(env), requireRole("admin"));

  router.get("/vendors/pending", (req, res) => {
    // Only admins can access this
    res.json({ message: "Pending vendors list" });
  });

  router.put("/vendors/:id/approve", (req, res) => {
    // Only admins can approve vendors
    res.json({ message: "Vendor approved" });
  });

  return router;
}

/**
 * Example 3: Multiple roles allowed
 * Both vendors and admins can access these routes
 */
export function createMixedRouter(env: Env) {
  const router = Router();
  
  // Apply authentication to all routes
  router.use(requireAuth(env));

  // This route allows both vendors and admins
  router.get("/statistics", requireRole("vendor", "admin"), (req, res) => {
    res.json({ 
      message: "Statistics", 
      role: req.auth?.role 
    });
  });

  // This route allows all authenticated users (customer, vendor, admin)
  router.get("/public-data", requireRole("customer", "vendor", "admin"), (req, res) => {
    res.json({ message: "Public data for authenticated users" });
  });

  return router;
}

/**
 * Example 4: Per-route role requirements
 * Different routes have different role requirements
 */
export function createFlexibleRouter(env: Env) {
  const router = Router();
  
  // Apply authentication to all routes
  router.use(requireAuth(env));

  // Customer-only route
  router.get("/bookings", requireRole("customer"), (req, res) => {
    res.json({ message: "Customer bookings" });
  });

  // Vendor-only route
  router.get("/vendor-dashboard", requireRole("vendor"), (req, res) => {
    res.json({ message: "Vendor dashboard" });
  });

  // Admin-only route
  router.get("/admin-panel", requireRole("admin"), (req, res) => {
    res.json({ message: "Admin panel" });
  });

  return router;
}

/**
 * Example 5: Public routes (no authentication required)
 * These routes don't use requireAuth or requireRole
 */
export function createPublicRouter() {
  const router = Router();

  // No authentication required
  router.get("/vendors", (req, res) => {
    res.json({ message: "Public vendor listing" });
  });

  router.get("/vendors/:id", (req, res) => {
    res.json({ message: "Public vendor profile" });
  });

  return router;
}

/**
 * Example 6: Conditional role checks within route handlers
 * Sometimes you need to check roles within the handler logic
 */
export function createConditionalRouter(env: Env) {
  const router = Router();
  
  router.use(requireAuth(env));

  router.get("/profile/:id", (req, res) => {
    const { role, userId } = req.auth!;
    const requestedId = req.params.id;

    // Admins can view any profile
    if (role === "admin") {
      return res.json({ message: "Admin viewing profile", profileId: requestedId });
    }

    // Users can only view their own profile
    if (userId === requestedId) {
      return res.json({ message: "Viewing own profile", profileId: requestedId });
    }

    // Otherwise, forbidden
    return res.status(403).json({ error: "Forbidden" });
  });

  return router;
}

/**
 * Example 7: Error handling with role-based access
 */
export function createErrorHandlingRouter(env: Env) {
  const router = Router();
  
  router.use(requireAuth(env));

  router.delete("/vendor/:id", requireRole("vendor", "admin"), (req, res) => {
    const { role, userId } = req.auth!;
    const vendorId = req.params.id;

    // Vendors can only delete their own profile
    if (role === "vendor" && userId !== vendorId) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "Vendors can only delete their own profile"
      });
    }

    // Admins can delete any vendor profile
    res.json({ message: "Vendor deleted", vendorId });
  });

  return router;
}
