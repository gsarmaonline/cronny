# Organy
The Organy is a service which lets you onboard different types of organizations.
Customers can connect to the service and define their organizations and how the
elements within the organization should interact with each other.
Organy will be hosted globally on a domain similar to organy.io and customers should
be able to access the domain based on <customer>.organy.io.

Inside the application, customers will be able define different features, different pricing
points, and control how the users interact with the features

## Example One: SDWAN Solution

### Controller
3 types of users:
- Admin
- Manager
- Monitor

Admin has access to all resources.
Manager has access to manage and monitor resources.
Monitor can only monitor the resources.

### Solution
Account manager can create multiple groups for the different user types.
Once the groups are created, any user can be assigned to the groups.
Account manager has to define a role where the respective group is allowed
to perform read/write operations on a feature, which is in this case is
the manage or monitor dashboards.


## Hierarchy 
- Allow customers to define their own accounts/organizations and have different projects within them
- Each project should be highly configurable
- Allow customers to define different features per project and also the pricing of the features
- Allow different types of pricing for every feature

## Authorization
- When customers define the account users, account users should be login to the system
- Account admins have to add/remove features from different roles and add the users into the roles
- Depending on the roles, users will be able to use the relevant features
- TODO: Check if the checking login flow should also be builtin

## Possible goals
- Heirarchy
- Company registration
- Authorization
- App allocation
- Documents
- ATS
- Equity
- Salary
- Insurance
- Feedback
- Device
