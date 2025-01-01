
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description, videoId} = req.body
    //TODO: create playlist
    const userId = req.user._id

    if (!name?.trim() || !description?.trim()) {
      throw new ApiError(400, "Name and description are required.");
    }

    if(!userId){
      throw new ApiError(401, "User Id required")
    }

    const newPlaylist = await Playlist.create({
      name,
      description,
      video: videoId || [],
      owner: userId
    })

    return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newPlaylist,
        "New playlist created"
      )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId){
      throw new ApiError(400, " User Id is required")
    }

    const playlist = await Playlist.find({
      owner: userId
    })

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
      )
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
      throw new ApiError(404, "Playlist Id not found")
    }

    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
      )
    )
  })

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
      throw new ApiError(400, "Target playlist and video required")
    }

    // Check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if(playlist.video.includes(videoId)){
      throw new ApiError(400, "Video already exists in the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {$push: {video: videoId}},// Append video ID to the `video` array
      { new: true } // Return the updated document
    )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to the playlist"
      )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId || !videoId){
      throw new ApiError(400, "Target playlist and video required")
    }

    // Check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if(!playlist.video.includes(videoId)){
      throw new ApiError(400, "Video doesn't exists in the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {$pull: {video: videoId}},// Remove video ID to the `video` array
      { new: true } // Return the updated document
    )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed to the playlist"
      )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const userId = req.user._id

    if(!playlistId){
      throw new ApiError(404, "Playlist Id not found")
    }

    if(!userId){
      throw new ApiError(401, "User Id required")
    }

    // Check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          success: true,
          data: null
        },
        "Playlist deleted"
      )
    )


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const userId = req.user._id
    //TODO: update playlist

    if(!playlistId){
      throw new ApiError(400, "Playlist Id required")
    }

    if (!name?.trim() || !description?.trim()) {
      throw new ApiError(400, "Name and description are required.");
    }

    // Check if the playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the logged-in user is the owner of the playlist
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to update this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {$set: {
        name,
        description
        }
      },
      {new: true}
    )

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Playlist updated"
      )
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
