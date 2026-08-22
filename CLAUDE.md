### Desciplines

- Keep variable naming consistent and meaningful. Choose names that clearly describe the variable’s purpose or functionality.
- Avoid abbreviations and ambiguous short names. Variable names should clearly indicate what the value represents. For example, use userId instead of user, userObj, or uid when referring to a user ID. If a variable contains a user object, use a clear name such as userObj. Similarly, use userName, userNumber, etc., when the specific meaning matters.

6. Avoid Magic Numbers and Strings

Avoid using hard-coded numbers or strings directly in business logic. Use meaningful constants or enums so that the purpose of the value is clear and easy to understand.

7. Avoid Duplicate Code (DRY)

Avoid repeating the same logic in multiple places. If the same logic is required in multiple places, extract it into a reusable function, utility, or component. However, avoid unnecessary abstraction for logic that is only coincidentally similar.

10. Write Meaningful Comments

Comments should explain why something is being done rather than simply describing what the code is doing. Avoid unnecessary comments when the code is already self-explanatory. Use comments for business rules, workarounds, limitations, or other non-obvious decisions.

11. Keep Code Organized

Keep related logic together and separate unrelated responsibilities. Avoid mixing validation, business logic, API calls, database operations, and formatting unnecessarily. Follow a consistent and predictable code structure so that functionality is easy to find and understand.

12. Avoid Unnecessary Complexity

Prefer simple, readable, and maintainable solutions over unnecessarily complex or clever implementations. Do not introduce additional abstractions, patterns, or layers unless they provide a clear benefit. Code should be easy for other developers to understand, modify, and maintain.

13. Use Constants for Repeated or Meaningful Values

Avoid repeating the same meaningful values throughout the code. Define such values as constants with descriptive names to improve readability, maintain consistency, and make future changes easier.
