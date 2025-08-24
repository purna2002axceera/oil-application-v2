import { L_Number_List } from "./l_numbers"


const calculateQuantity = ( quantity, prod_code ) =>{
   //Find the details for l number
   const details = L_Number_List.find(data => data.code === prod_code.split(' ')[2]);

   let  quantityInLiters;
   let  quantityInMili;
   if( details ){
     if( details.pack_unit == 'ml' ){
        quantityInLiters = (quantity * details.pack_size)/100
        quantityInMili = quantity * details.pack_size
     } else {
        quantityInLiters = quantity * details.pack_size
        quantityInMili = quantity * details.pack_size * 1000
     }
     return { quantityInLiters, quantityInMili, message: "no matching details", success: true }
   }
   return { message: "no matching details", success: false}
}

export default calculateQuantity;