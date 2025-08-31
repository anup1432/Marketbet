import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["/api/admin/recent-activity"],
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/transactions/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Transaction Updated",
        description: "Transaction status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (username === "admin1432" && password === "Admin1432") {
      setIsAuthenticated(true);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel.",
      });
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = (id: string) => {
    updateTransactionMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateTransactionMutation.mutate({ id, status: "rejected" });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-admin-password"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" data-testid="button-admin-login">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingDeposits = transactions.filter((tx: any) => tx.type === "deposit");
  const pendingWithdrawals = transactions.filter((tx: any) => tx.type === "withdraw");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="admin-panel-title">Admin Panel</h1>
          <Button
            variant="outline"
            onClick={() => setIsAuthenticated(false)}
            data-testid="button-admin-logout"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Deposits */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="pending-deposits">
                {pendingDeposits.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No pending deposits
                  </div>
                ) : (
                  pendingDeposits.map((tx: any) => (
                    <div key={tx._id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">${tx.amount} USDT</div>
                          <div className="text-sm text-muted-foreground">{tx.network.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            User ID: {tx.userId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(tx._id)}
                            disabled={updateTransactionMutation.isPending}
                            data-testid={`button-approve-deposit-${tx._id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(tx._id)}
                            disabled={updateTransactionMutation.isPending}
                            data-testid={`button-reject-deposit-${tx._id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        Address: {tx.address}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Withdrawals */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="pending-withdrawals">
                {pendingWithdrawals.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No pending withdrawals
                  </div>
                ) : (
                  pendingWithdrawals.map((tx: any) => (
                    <div key={tx._id} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">${tx.amount} USDT</div>
                          <div className="text-sm text-muted-foreground">{tx.network.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            User ID: {tx.userId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(tx._id)}
                            disabled={updateTransactionMutation.isPending}
                            data-testid={`button-approve-withdraw-${tx._id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(tx._id)}
                            disabled={updateTransactionMutation.isPending}
                            data-testid={`button-reject-withdraw-${tx._id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground break-all">
                        To: {tx.address}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No users found
                </div>
              ) : (
                users.map((user: any) => (
                  <div key={user._id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">User ID: {user.userId}</div>
                      <div className="text-sm text-muted-foreground">IP: {user.ipAddress}</div>
                      <div className="text-xs text-muted-foreground">
                        Joined: {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-400">${user.balance}</div>
                      <div className="text-xs text-muted-foreground">Balance</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Limited to 4 items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent User Activity (Last 4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No recent activity
                </div>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity._id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {activity.type === 'deposit' ? '📥' : '📤'} {activity.type.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">User: {activity.userId}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${activity.amount}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                        activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
