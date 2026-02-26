
# zodValidator

  



## Overview

  

The zod-validator package provides a custom React hook, useZodState, which combines the power of React state management with the Zod validation library. This hook helps manage form state and validate inputs using Zod schemas, providing a simple way to handle form data and validation in React applications.

## Installation

  

First, install the zod-validator package and its peer dependency, zod, using npm:

  

    npm install @jazdevv/zod-validator zod

  

## Usage
  

    import { useZodState } from '@jazdevv/zod-validator';
    
    import { z } from 'zod';

  

Defining a Zod Schema

Define a Zod schema that describes the structure and validation rules for your form data. For example:


  

    const schema = z.object({
    
    name: z.string().min(1, 'Name is required'),
    
    age: z.number().min(18, 'Age must be at least 18'),
    
    });

  

Using the useZodState Hook

  

Use the useZodState hook within your component to manage form state and validation:

  

    `
    function MyFormComponent() {
    
    const { inputs, error, validate, setValues, setZodSchema } = useZodState({
    
    initialValues: {
    
    name: '',
    
    age: '',
    
    },
    
    schema: schema,
    
    });
    
      
    
    const handleSubmit = (event) => {
    
    event.preventDefault();
    
    if (validate()) {
    
    // Form is valid, proceed with submission
    
    console.log('Form data:', inputs);
    
    } else {
    
    // Form is invalid, display errors
    
    console.log('Validation errors:', error);
    
    }
    
    };
    
      
    
    const handleChange = (event) => {
    
    const { name, value } = event.target;
    
    setValues({ [name]: value });
    
    };
    
      
    
    return (
    
    <form onSubmit={handleSubmit}>
    
    <div>
    
    <label>
    
    Name:
    
    <input
    
    type="text"
    
    name="name"
    
    value={inputs.name}
    
    onChange={handleChange}
    
    />
    
    </label>
    
    {error.name && <span>{error.name}</span>}
    
    </div>
    
    <div>
    
    <label>
    
    Age:
    
    <input
    
    type="number"
    
    name="age"
    
    value={inputs.age}
    
    onChange={handleChange}
    
    />
    
    </label>
    
    {error.age && <span>{error.age}</span>}
    
    </div>
    
    <button type="submit">Submit</button>
    
    </form>
    
    );
    
    }
    
      
    
   
  

## Parameters:

  
| parameters (Object) | description |
|--|--|
| initialValues (Object) | An object representing the initial values of the form inputs. |
| schema (Zod Schema) | A Zod schema object that defines the validation rules for the form. |


## Returns:
| returned key | desc |
|--|--|
| inputs (Object) | The current state of the form inputs |
| error (Object) |  An object containing validation error messages. |
| validate (Function) | A function that validates the form inputs against the Zod schema. Returns true if valid, false otherwise. |
| setValues (Function) | A function to update the form inputs. Takes an object of key-value pairs to update the state.
| setZodSchema (Function) |  A function to update the Zod schema used for validation. |



  

Here is a complete example demonstrating how to use the useZodState hook in a React component:

  

  

    import React from 'react';
    
    import { useZodState } from '@jazdevv/zod-validator';
    
    import { z } from 'zod';
    
      
    
    const schema = z.object({
    
    name: z.string().min(1, 'Name is required'),
    
    age: z.number().min(18, 'Age must be at least 18'),
    
    });
    
      
    
    function MyFormComponent() {
    
        const { inputs, error, validate, setValues, setZodSchema } = useZodState({
        
        initialValues: {
        
        name: '',
        
        age: '',
        
        },
        
        schema: schema,
        
        });
    
      
    
        const handleSubmit = (event) => {
        
            event.preventDefault();
        
            if (validate()) {
        
                console.log('Form data:', inputs);
        
            } else {
        
                console.log('Validation errors:', error);
        
            }
        
        };
    
      
    
        const handleChange = (event) => {
        
            const { name, value } = event.target;
        
            setValues({ [name]: value });
        
        };
    
      
    
        return (
        
        <form  onSubmit={handleSubmit}>
        
            <div>
            
                <label> Name: </label>
                
                <input
                
                    type="text"
                    
                    name="name"
                    
                    value={inputs.name}
                    
                    onChange={handleChange}
                
                />
                
                {error.name && <span>{error.name}</span>}
                
            </div>
                
            <div>
                
                <label> Age:</label>
                
                <input
                
                    type="number"
                    
                    name="age"
                    
                    value={inputs.age}
                    
                    onChange={handleChange}
                
                />
                
                
                {error.age && <span>{error.age}</span>}
            
            </div>
            
            <button  type="submit">Submit</button>
        
        </form>
        
        );
    
    }
    
      
    
    export default MyFormComponent;


