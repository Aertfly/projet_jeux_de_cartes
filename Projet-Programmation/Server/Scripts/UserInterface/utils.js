function getMaxId(db){
    return new Promise((resolve,reject)=>{
        db.query('Select MAX(idR) as idR from robots',[],(err,result)=>{
            if(err)reject(err);
            db.query('Select MAX(idJ) as idJ from joueurs',[],(err2,res2)=>{
                if(err2)reject(err2)
                const max = maximum(result[0].idR,res2[0].idJ)
                resolve( max ? max: 0);
            });
        });
    });
}

function maximum(i,j){
    if(i>j)return i;
    else return j;
}

module.exports = {getMaxId}