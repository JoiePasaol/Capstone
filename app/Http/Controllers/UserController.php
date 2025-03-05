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
                'status' => 'required|string|in:approved,declined', 
                'role' => 'required|string|in:Admin,Basic', 
            ]);
    
            $status = $request->input('status');
            $role = $request->input('role');
            
            // Perform the update
            $user->status = $status;
            $user->role = $role;
            $user->save();
    
            return response()->json(['message' => 'Status and role updated successfully'], 200);
        } catch (ValidationException $e) {
            return response()->json(['error' => $e->errors()], 400); 
        } catch (\Exception $e) {
            \Log::error("Error updating user status: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();
    
            return response()->json(['message' => 'User deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting user: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:users,id', 
        ]);
    
        try {
            \Log::info("Deleting users: " . implode(',', $request->ids)); // Debugging
    
            User::whereIn('id', $request->ids)->delete();
    
            return response()->json(['message' => 'Users deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting users: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }
    

    

    public function update(Request $request, $id)
    {
        \Log::info("Updating user with ID: {$id}");
        
        try {
            $user = User::findOrFail($id);
    
            $request->validate([
                'firstname' => 'string|max:255',
                'lastname' => 'string|max:255',
                'email' => 'email|max:255',
                'department' => 'string|max:255',
                'role' => 'string|in:Admin,Basic',
             

            ]);
    
            $user->firstname = $request->input('firstname');
            $user->lastname = $request->input('lastname');
            $user->email = $request->input('email');
            $user->department = $request->input('department');
            $user->role = $request->input('role');
    
            $user->save();
    
        
        } catch (\Exception $e) {
            \Log::error("Error updating user: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function getPendingUsersCount(Request $request)
    {
        try {
            $user = $request->user(); 
    
  
            $query = User::where('status', 'pending');
            
            if ($user->role === 'Admin') {
                $query->where('department', $user->department);
            }
    
            $count = $query->count();
    
            return response()->json(['pending_users' => $count], 200);
        } catch (\Exception $e) {
            \Log::error("Error fetching pending users count: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }
    
    
    public function getApprovedUsersCount(Request $request)
    {
        try {
            $user = $request->user(); // Get the authenticated user
    
            // If user is a regular admin, filter by department
            $query = User::where('status', 'approved')
                         ->where('id', '!=', $user->id); // Exclude the authenticated user
    
            if ($user->role === 'Admin') {
                $query->where('department', $user->department);
            }
    
            $count = $query->count();
    
            return response()->json(['approved_users' => $count], 200);
        } catch (\Exception $e) {
            \Log::error("Error fetching approved users count: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }
    
    
    
}
