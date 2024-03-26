import User from "../models/user.js";

export const getUser= async(req,res) => {
    try {

        const { id } = req.params;
        const user= await User.findById(id);
        res.status(200).json(user);

        
    } catch (err) {
        res.status(404).json({message : err.message});
    }
}


export const updateUser = async(req, res) => {
    try {
        const userId = req.params.id;
        const updateFields = req.body;
    
        // Find  user by ID and update
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });
        
        console.log(req.body);
        console.log(updatedUser);


        // if (!updatedUser) {
        //   return res.status(404).json({ msg: 'User not found' });
        // }
    
        res.status(200).json(updatedUser);

    } catch (err) {
        res.status(404).json({message : err.message});
    }
}

export const getUserFriends= async (req,res)=>{
    
    try {
        const {id} = req.params;
    const user= await User.findById(id);
    const friends = await Promise.all(
        user.friends.map((id)=>User.findById(id))
    );
    const formattedFriends = friends.map(
        ({_id, userName, firstName, lasrName, email, picturePath})=> {
            return {_id, userName, firstName, lasrName, email, picturePath};
        }
    );

    res.status(200).json(formattedFriends);
        
    } catch (err) {
        res.status(404).json({message : err.message});
    }
    
}