// TinyLisp — A Complete Lisp Interpreter in Pure JavaScript
// Features: lambda, closures, recursion, define, if, quote,
// let, cons/car/cdr, map/filter, arithmetic, comparison
//
// Example: (define fib (lambda (n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2))))))

function tokenize(s){return s.replace(/\(/g,' ( ').replace(/\)/g,' ) ').trim().split(/\s+/)}

function parse(tokens,i){
  i=i||{v:0};
  var t=tokens[i.v++];
  if(t==='('){
    var L=[];
    while(tokens[i.v]!==')')L.push(parse(tokens,i));
    i.v++;return L;
  }
  var n=Number(t);return isNaN(n)?t:n;
}

function Env(m,outer){this.m=m||{};this.o=outer}
Env.prototype.get=function(k){return k in this.m?this.m[k]:this.o?this.o.get(k):undefined};
Env.prototype.set=function(k,v){this.m[k]=v};

function stdlib(){
  return new Env({
    '+':function(a,b){return a+b},'-':function(a,b){return b===undefined?-a:a-b},
    '*':function(a,b){return a*b},'/':function(a,b){return a/b},
    '%':function(a,b){return a%b},
    '>':function(a,b){return a>b},'<':function(a,b){return a<b},
    '=':function(a,b){return a===b},'>=':function(a,b){return a>=b},
    'not':function(a){return!a},
    'cons':function(a,b){return[a].concat(b||[])},'car':function(a){return a[0]},
    'cdr':function(a){return a.slice(1)},'list':function(){return[].slice.call(arguments)},
    'null?':function(a){return!a||a.length===0},
    'length':function(a){return a.length},
    'map':function(f,l){return l.map(f)},
    'filter':function(f,l){return l.filter(f)},
    'apply':function(f,a){return f.apply(null,a)},
    'print':function(x){console.log(x);return x},
    'pi':Math.PI,'true':true,'false':false
  });
}

function ev(x,e){
  if(typeof x==='string')return e.get(x);
  if(!Array.isArray(x))return x;
  var op=x[0];
  if(op==='quote')return x[1];
  if(op==='if')return ev(x[1],e)?ev(x[2],e):x[3]!==undefined?ev(x[3],e):false;
  if(op==='define'){e.set(x[1],ev(x[2],e));return e.get(x[1])}
  if(op==='lambda')return function(){
    var m={};x[1].forEach(function(p,i){m[p]=arguments[i]}.bind(null));
    // bind params to args
    var args=arguments;x[1].forEach(function(p,i){m[p]=args[i]});
    return ev(x[2],new Env(m,e));
  };
  if(op==='let'){
    var m={};x[1].forEach(function(b){m[b[0]]=ev(b[1],e)});
    return ev(x[2],new Env(m,e));
  }
  if(op==='begin'){var r;x.slice(1).forEach(function(s){r=ev(s,e)});return r}
  var proc=ev(op,e);
  var args=x.slice(1).map(function(a){return ev(a,e)});
  return proc.apply(null,args);
}

function run(code,env){
  env=env||stdlib();
  return ev(parse(tokenize(code)),env);
}

// === Demo ===
console.log('=== TinyLisp Interpreter ===\n');
var e=stdlib();
run('(define fact (lambda (n) (if (= n 0) 1 (* n (fact (- n 1))))))',e);
console.log('10! =', run('(fact 10)',e));
run('(define fib (lambda (n) (if (< n 2) n (+ (fib (- n 1)) (fib (- n 2))))))',e);
console.log('fib(10) =', run('(fib 10)',e));
run('(define sq (lambda (x) (* x x)))',e);
console.log('map sq [1..5] =', JSON.stringify(run('(map sq (list 1 2 3 4 5))',e)));
console.log('filter even =', JSON.stringify(run('(filter (lambda (x) (= (% x 2) 0)) (list 1 2 3 4 5 6))',e)));
console.log('let: x+y =', run('(let ((x 10)(y 20)) (+ x y))',e));

module.exports={parse:function(s){return parse(tokenize(s))},ev:ev,run:run,stdlib:stdlib,Env:Env};
