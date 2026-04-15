use bun.  
use early returns.  
use DRY wherever possible while retaining maintainability and prioritizing readability.  
don't use abbreviations in function names and variables, use full words.

Variable naming rules:
1. If a var represents a boolean, it must be prefixed with "is"
2. If a var represents an element, it must be prefixed with "el"
3. If a bar represents an index, it must be prefixed with "i", unless iterating over an array in a for loop or a higher-order function, in which case it can stay as "i"
