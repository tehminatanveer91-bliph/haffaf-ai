import {NextRequest,NextResponse} from 'next/server';
import { checkRateLimit } from "../../../lib/rate-limit";
export const runtime='nodejs';
type Msg={role:'user'|'assistant'|'system';content:string};
export async function POST(req:NextRequest){
 try{
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'anonymous';
  const limit=Number(process.env.RATE_LIMIT_PER_MINUTE||20);if(!checkRateLimit(ip,Number.isFinite(limit)?limit:20).allowed)return NextResponse.json({error:'Too many requests. Please try again in a minute.'},{status:429});
  const body=await req.json();const messages=body?.messages as Msg[];
  if(!Array.isArray(messages)||!messages.length||messages.length>30)return NextResponse.json({error:'Invalid conversation.'},{status:400});
  const clean=messages.filter(m=>['user','assistant','system'].includes(m?.role)&&typeof m?.content==='string').map(m=>({role:m.role,content:m.content.trim()})).filter(m=>m.content);
  if(!clean.length||clean.some(m=>m.content.length>20000))return NextResponse.json({error:'Message is empty or too long.'},{status:400});
  const key=process.env.AI_API_KEY,base=(process.env.AI_BASE_URL||'https://api.openai.com/v1').replace(/\/$/,''),model=process.env.AI_MODEL||'gpt-4.1-mini';
  if(!key)return NextResponse.json({error:'AI is not configured yet. Add AI_API_KEY to the server environment.'},{status:503});
  const r=await fetch(`${base}/chat/completions`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({model,messages:[{role:'system',content:'You are Haffaf AI, a helpful, accurate and concise AI assistant. Use Markdown when useful. Do not claim actions you did not perform.'},...clean],temperature:.7}),cache:'no-store'});
  if(!r.ok){console.error('AI provider error',r.status,(await r.text()).slice(0,500));return NextResponse.json({error:r.status===429?'The AI service is rate-limited. Please try again shortly.':'Sorry, I could not process that request. Please try again.'},{status:r.status===429?429:502})}
  const data=await r.json();const answer=data?.choices?.[0]?.message?.content;if(typeof answer!=='string'||!answer.trim())return NextResponse.json({error:'The AI returned an empty answer. Please try again.'},{status:502});
  return NextResponse.json({answer:answer.trim(),model});
 }catch(e){console.error(e);return NextResponse.json({error:'Sorry, I could not process that request. Please try again.'},{status:500})}
 }
