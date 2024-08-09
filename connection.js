require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const userSchema= new mongoose.Schema({
    username:{
        type:String,
        required:true
    }
});

const exerciseSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
});

const User = mongoose.model('User', userSchema);

const Exercise = mongoose.model('Exercise', exerciseSchema)

const createUser = async (name) => {
    const user = new User({
        username:name
    });
    try {
        const result = await user.save();
        return result;
    } catch (error) {
        return {error:error.message}
    }
};

const allUsers = async () => {
    try {
        const users = await User.find({});
        const specified = users.map(user => {
            const {__v , ...newUser} = user.toObject();
            return newUser;
        })
        return specified;
    } catch (error) {
        return {error:error.message}
    }
};

const createExercise = async (exercise) => {
    const exer = new Exercise(exercise);
    try {
        const user = await User.findById(exercise.user);
        if (!user)
            throw new Error('User not found');
        const result = await exer.save();
        const {_id, __v, user:userRefernce, date,  ...exerciseInfo} = result.toObject();
        const {__v:userVersion, ...userInfo} = user.toObject();
        return {...userInfo, ...exerciseInfo,date:date?.toDateString() || null};
    } catch (error) {
        return {error:error.message};        
    }
};

const logs = async (id, limit, from, to) => {
    try {
        const user = await User.findById(id);
        if (!user)
            throw new Error('User not found');  
        const {__v, ...userInfo} = user.toObject();
        let exercises;
        if (from) {
            exercises = await Exercise.find({
                user:id,
                date:{$gte:from, $lte:to || Date.now()}
            }).exec(); 
        }
        else {
            exercises = await Exercise.find({user:id}).exec(); 
        } 

        const count = exercises.length;
        if (!count)
            return {...userInfo, count};

        let log;
        if (!limit){
            log = exercises.map(exercise => {
                const {user:userReferance, __v: exerciseVersion, _id, date, ...exerciseInfo} = exercise.toObject();
                return {...exerciseInfo, date:date?.toDateString()};
            })
        } else {
            log = exercises.slice(0,limit).map(exercise => {
                const {user:userReferance, __v: exerciseVersion, _id, date, ...exerciseInfo} = exercise.toObject();
                return {...exerciseInfo, date:date?.toDateString()};
            })
        }

        return {...userInfo, count,log};
    } catch (error) {
        console.log(error)
        return {error:error.message}
    }
}
module.exports = {
    createUser,
    allUsers,
    createExercise,
    logs
}