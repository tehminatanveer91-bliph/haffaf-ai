'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {
  Bot,
  Check,
  Copy,
  Menu,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  Sun,
  Trash2,
  X,
  Square
} from 'lucide-react';
import {marked} from 'marked';

type Role='user'|'assistant';

type Msg={
  id:string;
  role:Role;
  content:string;
  time:number;
};

type Chat={
  id:string;
  title:string;
  created:number;
  updated:number;
  messages:Msg[];
};

const KEY='haffaf-ai-chats-v1',
THEME='haffaf-ai-theme',
MAX=8000;

const uid=()=>crypto.randomUUID?.()||String(Date.now()+Math.random());

const blank=():Chat=>{
  const t=Date.now();
  return{
    id:uid(),
    title:'New chat',
    created:t,
    updated:t,
    messages:[]
  };
};

const title=(s:string)=>{
  s=s.replace(/\s+/g,' ').trim();
  return s.length>38?s.slice(0,38)+'…':s||'New chat';
};

const date=(t:number)=>
  new Intl.DateTimeFormat(undefined,{
    month:'short',
    day:'numeric',
    hour:'numeric',
    minute:'2-digit'
  }).format(t);

const md=(s:string)=>marked.parse(s,{breaks:true}) as string;

export default function HaffafAI(){

  const[
    chats,
    setChats
  ]=useState<Chat[]>([]);

  const[
    activeId,
    setActiveId
  ]=useState('');

  const[
    input,
    setInput
  ]=useState('');

  const[
    loading,
    setLoading
  ]=useState(false);

  const[
    theme,
    setTheme
  ]=useState<'dark'|'light'>('dark');

  const[
    open,
    setOpen
  ]=useState(false);

  const[
    about,
    setAbout
  ]=useState(false);

  const[
    copied,
    setCopied
  ]=useState('');

  const abort=useRef<AbortController|null>(null);

  const bottom=useRef<HTMLDivElement|null>(null);

  const active=useMemo(
    ()=>chats.find(c=>c.id===activeId)||null,
    [chats,activeId]
  );

  useEffect(()=>{
    try{
      const s=JSON.parse(
        localStorage.getItem(KEY)||'[]'
      );

      if(Array.isArray(s)&&s.length){
        setChats(s);
        setActiveId(s[0].id);
      }else{
        const c=blank();
        setChats([c]);
        setActiveId(c.id);
      }

      if(localStorage.getItem(THEME)==='light'){
        setTheme('light');
      }

    }catch{
      const c=blank();
      setChats([c]);
      setActiveId(c.id);
    }
  },[]);

  useEffect(()=>{
    if(chats.length){
      localStorage.setItem(
        KEY,
        JSON.stringify(chats)
      );
    }
  },[chats]);

  useEffect(()=>{
    localStorage.setItem(THEME,theme);
  },[theme]);

  useEffect(()=>{
    bottom.current?.scrollIntoView({
      behavior:'smooth'
    });
  },[active?.messages.length,loading]);

  const update=(
    id:string,
    fn:(c:Chat)=>Chat
  )=>
    setChats(p=>
      p.map(c=>
        c.id===id?fn(c):c
      )
    );

  function newChat(){
    const c=blank();

    setChats(p=>[c,...p]);
    setActiveId(c.id);
    setInput('');
    setOpen(false);
  }

  function del(id:string){
    setChats(p=>{
      const n=p.filter(c=>c.id!==id);
      const a=n.length?n:[blank()];

      if(id===activeId){
        setActiveId(a[0].id);
      }

      return a;
    });
  }

  function rename(c:Chat){
    const v=prompt(
      'Rename conversation',
      c.title
    );

    if(v?.trim()){
      update(
        c.id,
        x=>({
          ...x,
          title:v.trim().slice(0,80),
          updated:Date.now()
        })
      );
    }
  }

  async function send(text=input){

    const content=text.trim();

    if(
      !content||
      loading||
      !active||
      content.length>MAX
    ){
      return;
    }

    const u:Msg={
      id:uid(),
      role:'user',
      content,
      time:Date.now()
    };

    const history=[
      ...active.messages,
      u
    ];

    update(
      active.id,
      c=>({
        ...c,
        title:c.messages.length
          ?c.title
          :title(content),
        messages:history,
        updated:Date.now()
      })
    );

    setInput('');
    setLoading(true);

    const ac=new AbortController();

    abort.current=ac;

    try{

      const r=await fetch(
        '/api/chat',
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            messages:history.map(
              m=>({
                role:m.role,
                content:m.content
              })
            )
          }),
          signal:ac.signal
        }
      );

      const d=await r.json().catch(
        ()=>({})
      );

      if(!r.ok){
        throw new Error(
          d.error||
          'Sorry, I could not process that request. Please try again.'
        );
      }

      const a:Msg={
        id:uid(),
        role:'assistant',
        content:d.answer,
        time:Date.now()
      };

      update(
        active.id,
        c=>({
          ...c,
          messages:[
            ...c.messages,
            a
          ],
          updated:Date.now()
        })
      );

    }catch(e){

      if(
        (e as Error).name!=='AbortError'
      ){

        const a:Msg={
          id:uid(),
          role:'assistant',
          content:`⚠️ ${(e as Error).message}`,
          time:Date.now()
        };

        update(
          active.id,
          c=>({
            ...c,
            messages:[
              ...c.messages,
              a
            ],
            updated:Date.now()
          })
        );
      }

    }finally{

      abort.current=null;
      setLoading(false);

    }
  }

  async function copy(m:Msg){

    await navigator.clipboard.writeText(
      m.content
    );

    setCopied(m.id);

    setTimeout(
      ()=>setCopied(''),
      1200
    );
  }

  function regen(){

    if(!active||loading)return;

    const msgs=active.messages;

    const i=[
      ...msgs
    ]
      .map(m=>m.role)
      .lastIndexOf('user');

    if(i<0)return;

    const h=msgs.slice(0,i+1);

    update(
      active.id,
      c=>({
        ...c,
        messages:h,
        updated:Date.now()
      })
    );

    setTimeout(
      ()=>send(h[h.length-1].content),
      0
    );
  }

  function key(
    e:React.KeyboardEvent<HTMLTextAreaElement>
  ){

    if(
      e.key==='Enter'&&
      !e.shiftKey
    ){

      e.preventDefault();
      send();

    }
  }

  const suggestions=[
    'Explain something to me',
    'Help me with homework',
    'Write something',
    'Give me an idea',
    'Solve a problem',
    'Tell me about a topic'
  ];

  return(
    <div className={`app ${theme}`}>

      <div className="layout">

        <aside
          className={`side ${
            open?'open':''
          }`}
        >

          <div className="brand">

            <div className="logo">
              H
            </div>

            <div>
              <b>Haffaf AI</b>
              <small>
                Your intelligent AI assistant
              </small>
            </div>

          </div>

          <button
            className="new"
            onClick={newChat}
          >
            <Plus size={17}/>
            New Chat
          </button>

          <div className="history">

            {[...chats]
              .sort(
                (a,b)=>b.updated-a.updated
              )
              .map(c=>(

              <div
                className={`item ${
                  c.id===activeId
                    ?'active'
                    :''
                }`}
                key={c.id}
              >

                <button
                  className="icon"
                  style={{
                    flex:1,
                    textAlign:'left'
                  }}
                  onClick={()=>{
                    setActiveId(c.id);
                    setOpen(false);
                  }}
                >

                  <main>

                    <div className="title">
                      {c.title}
                    </div>

                    <div className="date">
                      {date(c.updated)}
                    </div>

                  </main>

                </button>

                <button
                  className="icon"
                  title="Rename"
                  onClick={()=>
                    rename(c)
                  }
                >
                  <Pencil size={13}/>
                </button>

                <button
                  className="icon"
                  title="Delete"
                  onClick={()=>
                    del(c.id)
                  }
                >
                  <Trash2 size={13}/>
                </button>

              </div>

            ))}

          </div>

          <div className="foot">

            <button
              className="new"
              onClick={()=>
                setAbout(true)
              }
            >
              <Bot size={15}/>
              About Haffaf AI
            </button>

            <button
              className="new"
              onClick={()=>
                setTheme(
                  t=>
                    t==='dark'
                      ?'light'
                      :'dark'
                )
              }
            >

              {theme==='dark'
                ?<Sun size={15}/>
                :<Moon size={15}/>
              }

              {theme==='dark'
                ?'Light mode'
                :'Dark mode'
              }

            </button>

            <div style={{padding:5}}>
              Developed by Haffaf
            </div>

          </div>

        </aside>

        {open&&(
          <div
            className="back"
            onClick={()=>
              setOpen(false)
            }
          />
        )}

        <main className="main">

          <header className="top">

            <div className="topname">

              <button
                className="icon mobile"
                onClick={()=>
                  setOpen(true)
                }
              >
                <Menu size={18}/>
              </button>

              <Bot
                size={17}
                color="#8c7aff"
              />

              {active?.title||'Haffaf AI'}

            </div>

            <div>

              <button
                className="icon"
                onClick={()=>
                  update(
                    activeId,
                    c=>({
                      ...c,
                      messages:[],
                      title:'New chat',
                      updated:Date.now()
                    })
                  )
                }
              >
                <Trash2 size={17}/>
              </button>

              <button
                className="icon"
                onClick={()=>
                  setTheme(
                    t=>
                      t==='dark'
                        ?'light'
                        :'dark'
                  )
                }
              >

                {theme==='dark'
                  ?<Sun size={17}/>
                  :<Moon size={17}/>
                }

              </button>

              <button
                className="icon"
                onClick={()=>
                  setAbout(true)
                }
              >
                <Settings2 size={17}/>
              </button>

            </div>

          </header>

          <section className="scroll">

            <div className="inner">

              {active?.messages.length===0
                ?

                <div className="welcome">

                  <div className="orb">
                    <Bot size={32}/>
                  </div>

                  <h1>
                    Haffaf AI
                  </h1>

                  <p>
                    Hi! I'm Haffaf AI 👋 Ask me anything.
                  </p>

                  <div className="suggest">

                    {suggestions.map(s=>(

                      <button
                        key={s}
                        onClick={()=>
                          send(s)
                        }
                      >
                        {s} →
                      </button>

                    ))}

                  </div>

                </div>

                :

                active?.messages.map(
                  (m,i)=>(

                  <div
                    className={`row ${m.role}`}
                    key={m.id}
                  >

                    <div className="avatar">
                      {m.role==='assistant'
                        ?'AI'
                        :'You'
                      }
                    </div>

                    <div className="bubble">

                      {m.role==='assistant'

                        ?

                        <div
                          dangerouslySetInnerHTML={{
                            __html:md(m.content)
                          }}
                        />

                        :

                        <div
                          style={{
                            whiteSpace:'pre-wrap'
                          }}
                        >
                          {m.content}
                        </div>

                      }

                      {m.role==='assistant'&&(

                        <div className="actions">

                          <button
                            className="icon"
                            onClick={()=>
                              copy(m)
                            }
                          >

                            {copied===m.id
                              ?<Check size={14}/>
                              :<Copy size={14}/>
                            }

                          </button>

                          {i===
                            active.messages.length-1&&
                            !loading&&(

                            <button
                              className="icon"
                              onClick={regen}
                            >
                              <RotateCcw size={14}/>
                            </button>

                          )}

                        </div>

                      )}

                    </div>

                  </div>

                )
              )}

              {loading&&(

                <div className="row assistant">

                  <div className="avatar">
                    AI
                  </div>

                  <div className="bubble">

                    <div className="typing">
                      <i/>
                      <i/>
                      <i/>
                    </div>

                  </div>

                </div>

              )}

              <div ref={bottom}/>

            </div>

          </section>

          <div className="composerWrap">

            <div className="composer">

              <textarea
                value={input}
                maxLength={MAX}
                disabled={loading}
                placeholder="Message Haffaf AI..."
                onChange={e=>
                  setInput(e.target.value)
                }
                onKeyDown={key}
              />

              <div className="composeRow">

                <span className="counter">
                  {input.length}/{MAX} · Enter to send · Shift+Enter for new line
                </span>

                {loading

                  ?

                  <button
                    className="send"
                    onClick={()=>{
                      abort.current?.abort();
                      setLoading(false);
                    }}
                  >
                    <Square
                      size={14}
                      fill="currentColor"
                    />
                    Stop
                  </button>

                  :

                  <button
                    className="send"
                    disabled={!input.trim()}
                    onClick={()=>
                      send()
                    }
                  >
                    <Send size={14}/>
                    Send
                  </button>

                }

              </div>

            </div>

            <div className="hint">
              Haffaf AI can make mistakes. Check important information.
            </div>

          </div>

        </main>

      </div>

      {about&&(

        <div
          className="modalBg"
          onClick={()=>
            setAbout(false)
          }
        >

          <div
            className="modal"
            onClick={e=>
              e.stopPropagation()
            }
          >

            <button
              className="icon"
              style={{float:'right'}}
              onClick={()=>
                setAbout(false)
              }
            >
              <X size={18}/>
            </button>

            <div className="brand">

              <div className="logo">
                H
              </div>

              <div>
                <b>Haffaf AI</b>
                <small>
                  Your intelligent AI assistant
                </small>
              </div>

            </div>

            <h2>
              An AI assistant created and developed by Haffaf.
            </h2>

            <p>
              <b>Developer:</b> Haffaf
            </p>

            <p>
              The browser talks to a secure server route.
              The AI API key stays in server environment
              variables and is never exposed to frontend
              JavaScript.
            </p>

            <p>
              Developed by Haffaf
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

Bas is file ka existing code select-all karke ye poora code paste kar do. "DOMPurify" ka import ismein nahi hai. Baaki tumhara "/api/chat", chat history, dark/light mode, regenerate, copy, rename/delete aur mobile sidebar wala system same hai. ❤️🔥

Aur "package.json" se DOMPurify abhi delete mat karna, jaise tumne kaha tha.
