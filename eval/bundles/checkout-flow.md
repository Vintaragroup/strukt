# Workspace: Checkout Flow

## Context
We need to support guest and registered checkouts with payment capture, retry, and success/failure UX.

## Components
- CheckoutPage (frontend)
- PaymentsAPI (backend)
- OrderService (backend)

## Requirements
- Guest checkout path (email only)
- Registered checkout path (address book)
- Payment authorization + capture
- Retry on soft failure, clear error on hard failure
- Receipt and redirect to order status page

## Notes
- Use shared UI components for forms and buttons
- Collect analytics on conversion and error codes
