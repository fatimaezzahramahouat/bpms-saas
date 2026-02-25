import { useState } from "react";
import { z } from "zod";

function useZodState({initialValues, schema}){
    
    const [inputs, setInputs] = useState(initialValues);
    const [error, setError] = useState({});
    const [linkSchema, setLinkSchema] = useState(schema);

    function validate(){
        try {
            linkSchema.parse(inputs);
            setError({}); 
            return true;
          } catch (error) {
            if (error instanceof z.ZodError) {
              setError(error.flatten().fieldErrors);
            }
            return false;
          }
          
    }

    function setValues(values, invalidateErrorValue = true){
        if(!values){
            console.error("useZodState cant update the state because undefined its not a valid new state")
            return;
        }

        setInputs({
            ...inputs,
            ...values
        })

        if(invalidateErrorValue){
            const keys = Object.keys(values);

            for (let key of keys){
                invalidateError(key)   
            }
            
        }
    }


    function invalidateError(key){
        setError({
            ...error,
            [key]:false
        })
    }

    return {validate, inputs, error, setZodSchema: setLinkSchema, setValues}
}

export { useZodState }