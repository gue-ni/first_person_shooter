
let _objectId = 0;

function A(){
    Object.defineProperty( this, 'id', { value: _objectId ++ } );

    function f1(){

    }

    function f2(){
        
    }
}


let a = new A();
console.log(a);

let b = new A();
console.log(b);



