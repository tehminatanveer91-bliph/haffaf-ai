type Bucket={count:number;reset:number};
const buckets=new Map<string,Bucket>();
export function checkRateLimit(key:string,limit:number){const now=Date.now();const b=buckets.get(key);if(!b||now>=b.reset){buckets.set(key,{count:1,reset:now+60000});return{allowed:true}}if(b.count>=limit)return{allowed:false};b.count++;return{allowed:true}}
