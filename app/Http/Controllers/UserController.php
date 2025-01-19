<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function fetchUsers(Request $request)
    {
        try {
            $status = $request->query('status', 'pending');
    
     
            $users = User::where('status', $status)->get();
            \Log::info($users); 
            return response()->json($users, 200);
        } catch (\Exception $e) {
       
            \Log::error("Error fetching users: {$e->getMessage()}");
    
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
    
            // Validate that role and status are provided
            $request->validate([
                'status' => 'required|string|in:approved,declined', // Ensure correct status
                'role' => 'required|string|in:Admin,Basic', // Ensure role is valid
            ]);
    
            $status = $request->input('status');
            $role = $request->input('role');
            
            // Perform the update
            $user->status = $status;
            $user->role = $role;
            $user->save();
    
            return response()->json(['message' => 'Status and role updated successfully'], 200);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 400); // Return validation errors
        } catch (\Exception $e) {
            \Log::error("Error updating user status: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id); // Ensure the user exists
            $user->delete(); // Delete the user from the database
    
            return response()->json(['message' => 'User deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting user: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function update(Request $request, $id)
{
    \Log::info("Updating user with ID: {$id}"); // Log the user ID

    try {
        $user = User::findOrFail($id);

        // Validate the incoming request
        $request->validate([
            'status' => 'string|in:approved,declined',
            'role' => 'string|in:Admin,Basic',
            'firstname' => 'string|max:255',
            'lastname' => 'string|max:255',
            'email' => 'email|max:255',
            'department' => 'string|max:255',
        ]);

        // Update user data
        $user->firstname = $request->input('firstname');
        $user->lastname = $request->input('lastname');
        $user->email = $request->input('email');
        $user->department = $request->input('department');
        $user->role = $request->input('role');
        $user->status = $request->input('status');

        $user->save(); // Save the changes

        return response()->json(['message' => 'User updated successfully'], 200);
    } catch (\Exception $e) {
        \Log::error("Error updating user: {$e->getMessage()}");
        return response()->json(['error' => 'Server error'], 500);
    }
}


    
}
