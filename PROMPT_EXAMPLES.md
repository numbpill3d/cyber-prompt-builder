# Prompt Examples for Cyber Prompt Builder

This document provides examples of prompts and their expected outputs to help you understand how the Cyber Prompt Builder works.

## Basic Prompt Structure

A good prompt should be clear, specific, and provide enough context for the AI to understand what you're looking for. Here's a basic structure:

```
[Task description] + [Specific requirements] + [Context/constraints] + [Output format]
```

## Example 1: Simple Function

**Prompt:**
```
Create a JavaScript function that calculates the Fibonacci sequence up to n terms. The function should return an array of numbers.
```

**Expected Output:**
```javascript
/**
 * Calculates the Fibonacci sequence up to n terms
 * @param {number} n - Number of terms to calculate
 * @return {number[]} Array containing the Fibonacci sequence
 */
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  
  const result = [0, 1];
  
  for (let i = 2; i < n; i++) {
    result.push(result[i-1] + result[i-2]);
  }
  
  return result;
}

// Example usage
console.log(fibonacci(10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Example 2: React Component

**Prompt:**
```
Create a React component for a user profile card. It should display a user's avatar, name, job title, and a short bio. Make it responsive and use Tailwind CSS for styling.
```

**Expected Output:**
```jsx
import React from 'react';

/**
 * UserProfileCard component displays user information in a card format
 * @param {Object} props - Component props
 * @param {string} props.name - User's full name
 * @param {string} props.avatar - URL to user's avatar image
 * @param {string} props.jobTitle - User's job title
 * @param {string} props.bio - Short user biography
 * @returns {JSX.Element} Rendered component
 */
const UserProfileCard = ({ name, avatar, jobTitle, bio }) => {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl hover:shadow-lg transition-shadow duration-300">
      <div className="md:flex">
        <div className="md:shrink-0">
          <img 
            className="h-48 w-full object-cover md:h-full md:w-48" 
            src={avatar || 'https://via.placeholder.com/150'} 
            alt={`${name}'s avatar`} 
          />
        </div>
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
            {jobTitle}
          </div>
          <h2 className="block mt-1 text-lg leading-tight font-medium text-black">
            {name}
          </h2>
          <p className="mt-2 text-slate-500">
            {bio}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;

// Example usage
// <UserProfileCard 
//   name="Jane Doe" 
//   avatar="/images/jane.jpg" 
//   jobTitle="Senior Developer" 
//   bio="Full-stack developer with 5 years of experience in React and Node.js." 
// />
```

## Example 3: API Endpoint

**Prompt:**
```
Create an Express.js API endpoint that handles user registration. It should validate the input, hash the password, and store the user in a MongoDB database. Include proper error handling.
```

**Expected Output:**
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User'); // Assuming a User model exists

const router = express.Router();

/**
 * User registration endpoint
 * POST /api/users/register
 */
router.post(
  '/register',
  [
    // Validation middleware
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/\d/)
      .withMessage('Password must contain a number')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter'),
    body('name').not().isEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'User already exists' }] 
        });
      }

      // Create new user
      user = new User({
        name,
        email,
        password
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Save user to database
      await user.save();

      // Return success response
      return res.status(201).json({ 
        message: 'User registered successfully',
        userId: user.id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        errors: [{ msg: 'Server error' }] 
      });
    }
  }
);

module.exports = router;
```

## Tips for Effective Prompts

1. **Be specific**: Clearly state what you want the code to do
2. **Provide context**: Mention frameworks, libraries, or specific technologies
3. **Specify requirements**: Include any constraints or specific features
4. **Request documentation**: Ask for comments and usage examples
5. **Mention edge cases**: Ask the AI to handle specific edge cases

## How the Prompt is Processed

When you submit a prompt:

1. The prompt is analyzed for complexity and language requirements
2. The appropriate AI provider is selected based on your settings and prompt characteristics
3. The prompt is optimized for the selected provider
4. The AI generates code based on your prompt
5. The response is parsed and formatted for display
6. The generated code is shown in the editor

## Advanced Prompting Techniques

### Follow-up Prompts

You can refine the generated code by submitting follow-up prompts:

**Initial Prompt:**
```
Create a function to sort an array of objects by a specific property
```

**Follow-up Prompt:**
```
Add error handling for invalid inputs and make the sort direction configurable
```

### Specifying Programming Paradigms

You can request specific programming paradigms:

```
Create a functional programming solution for filtering and mapping an array of user objects
```

```
Create an object-oriented implementation of a shopping cart system with TypeScript
```

### Requesting Test Cases

You can ask for test cases along with the implementation:

```
Create a function to validate email addresses and include Jest test cases for various scenarios
```
