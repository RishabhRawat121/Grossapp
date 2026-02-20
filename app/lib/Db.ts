import mongoose from "mongoose";

const Mongodb_Url=process.env.MONGODB_URL

if(!Mongodb_Url){
    throw new Error("db error");
}
declare global{
    var mongooseCache:{conn:mongoose.Connection|null;promise:Promise<mongoose.Connection>|null}
}
let cache=global.mongooseCache

if(!cache){
  global.mongooseCache={conn:null,promise:null};
  cache=global.mongooseCache
}

const connectDb=async():Promise<mongoose.Connection>=>{
    if(cache.conn){
        return cache.conn
    }
    if(!cache.promise){
        cache.promise= mongoose.connect(Mongodb_Url)
        .then((conn)=>conn.connection )
    
}
    try {
        cache.conn=await cache.promise
        return cache.conn
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export default connectDb;