# Fix M-Pesa Deposit Callback for Registration Deposits

## Tasks
- [x] Modify mpesa_deposit_callback to check for both cache keys: "stk_deposit_" and "stk_deposit_reg_"
- [x] For registration deposits ("stk_deposit_reg_"), only update payment status, don't assign tenant
- [x] For regular deposits ("stk_deposit_"), assign tenant as before
- [x] Ensure proper logging for both cases
- [ ] Test the callback handling for both deposit types
