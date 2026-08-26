export class ClassificationRequestDto {
   text: string;
 }
 
 export class ClassificationResponseDto {
   category: string;
   input_text: string;
   lawyers: any[];
 }