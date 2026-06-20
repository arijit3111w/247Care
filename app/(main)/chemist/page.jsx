"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Package, ShoppingCart, Loader2, Plus, Trash2, Edit, MinusCircle, Search } from "lucide-react";
import { getCurrentUser } from "@/actions/onboarding";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// AG Grid Imports
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ChemistDashboard() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states for adding new medicine
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Dialog states for Quick Sell
  const [medicineToSell, setMedicineToSell] = useState(null);
  const [sellQuantity, setSellQuantity] = useState("");

  // Dialog states for Edit
  const [medicineToEdit, setMedicineToEdit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  
  // Grid Filter state
  const [quickFilterText, setQuickFilterText] = useState("");

  const inventory = useQuery(api.medicines.getInventory);
  const addMedicine = useMutation(api.medicines.addMedicine);
  const updateMedicine = useMutation(api.medicines.updateMedicine);
  const deleteMedicine = useMutation(api.medicines.deleteMedicine);

  useEffect(() => {
    async function loadUser() {
      if (!isLoaded) return;
      if (!clerkUser) {
        redirect("/sign-in");
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          redirect("/onboarding");
          return;
        }

        if (user.role !== "CHEMIST") {
          redirect("/");
          return;
        }

        setDbUser(user);
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [clerkUser, isLoaded]);

  // Handle cell edits in grid
  const handleCellValueChanged = async (event) => {
    try {
      await updateMedicine({
        medicineId: event.data._id,
        quantity: Number(event.data.quantity),
        price: Number(event.data.price),
      });
      toast.success("Inventory updated");
    } catch (error) {
      toast.error("Failed to update inventory");
      console.error(error);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newName || !newQuantity || !newPrice) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await addMedicine({
        medicineName: newName,
        quantity: Number(newQuantity),
        price: Number(newPrice),
      });
      setNewName("");
      setNewQuantity("");
      setNewPrice("");
      toast.success("Medicine added to inventory");
    } catch (error) {
      toast.error("Failed to add medicine");
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to remove this medicine?")) {
      try {
        await deleteMedicine({ medicineId: id });
        toast.success("Medicine removed");
      } catch (error) {
        toast.error("Failed to remove medicine");
      }
    }
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (!medicineToSell || !sellQuantity) return;
    
    const qtyToDeduct = Number(sellQuantity);
    if (qtyToDeduct > medicineToSell.quantity) {
      toast.error(`You only have ${medicineToSell.quantity} in stock!`);
      return;
    }

    try {
      await updateMedicine({
        medicineId: medicineToSell._id,
        quantity: medicineToSell.quantity - qtyToDeduct,
      });
      toast.success(`Recorded sale of ${qtyToDeduct} ${medicineToSell.medicineName}`);
      setMedicineToSell(null);
      setSellQuantity("");
    } catch (error) {
      toast.error("Failed to record sale");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!medicineToEdit || !editName || !editQuantity || !editPrice) return;
    
    try {
      await updateMedicine({
        medicineId: medicineToEdit._id,
        medicineName: editName,
        quantity: Number(editQuantity),
        price: Number(editPrice),
      });
      toast.success(`${editName} updated successfully`);
      setMedicineToEdit(null);
    } catch (error) {
      toast.error("Failed to update medicine");
    }
  };

  const openSellDialog = (med) => {
    setMedicineToSell(med);
    setSellQuantity("");
  };

  const openEditDialog = (med) => {
    setMedicineToEdit(med);
    setEditName(med.medicineName);
    setEditQuantity(med.quantity.toString());
    setEditPrice(med.price.toString());
  };

  // AG Grid Configuration
  const gridRef = useRef();
  const colDefs = useMemo(() => [
    { field: "medicineName", headerName: "Medicine Name", flex: 2, editable: false },
    { 
      field: "quantity", 
      headerName: "Quantity in Stock", 
      flex: 1, 
      editable: true,
      valueParser: params => Number(params.newValue),
    },
    { 
      field: "price", 
      headerName: "Price (₹)", 
      flex: 1, 
      editable: true,
      valueParser: params => Number(params.newValue),
    },
    {
      headerName: "Actions",
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        return (
          <div className="flex gap-2 items-center h-full">
            <Button 
              variant="ghost" 
              size="sm" 
              title="Record Sale (Reduce Stock)"
              className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 h-8 w-8 p-0"
              onClick={() => openSellDialog(params.data)}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Edit Details"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 h-8 w-8 p-0"
              onClick={() => openEditDialog(params.data)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Delete Medicine"
              className="text-red-500 hover:text-red-700 hover:bg-red-500/10 h-8 w-8 p-0"
              onClick={() => handleDelete(params.data._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (dbUser?.verificationStatus === "PENDING") {
    return (
      <div className="container max-w-4xl mx-auto p-4 md:p-8 pt-24 text-center">
        <Store className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">Verification Pending</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your pharmacy profile is currently under review by our administration team. 
          You will gain access to your inventory dashboard once your license has been verified.
        </p>
      </div>
    );
  }

  const totalItems = inventory?.length || 0;
  const lowStockItems = inventory?.filter(m => m.quantity < 10).length || 0;

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your inventory and orders for {dbUser?.shopName || "your shop"}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-emerald-900/10 border-emerald-900/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-emerald-50">
              Total Medicines Types
            </CardTitle>
            <Package className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tracked in inventory
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/10 border-emerald-900/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-emerald-50">
              Low Stock Alerts
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Items with &lt; 10 units
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/10 border-emerald-900/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-emerald-50">
              Total Value
            </CardTitle>
            <Store className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ₹{inventory?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-emerald-900/20 bg-background mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-white">Add New Medicine</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMedicine} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Medicine Name</label>
              <Input 
                placeholder="e.g. Paracetamol 500mg" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted/50 border-emerald-900/30"
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Quantity</label>
              <Input 
                type="number" 
                min="0"
                placeholder="100" 
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="bg-muted/50 border-emerald-900/30"
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Price (₹)</label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="15.00" 
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="bg-muted/50 border-emerald-900/30"
              />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-emerald-900/20 bg-background">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl text-white">Inventory Management</CardTitle>
            <CardDescription>
              Use the Quick Sale button to reduce stock, the Edit button to modify details, or double-click any cell to edit instantly.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="pl-9 bg-muted/50 border-emerald-900/30"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-alpine-dark w-full h-[500px]">
            {inventory === undefined ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <AgGridReact
                ref={gridRef}
                rowData={inventory}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                onCellValueChanged={handleCellValueChanged}
                animateRows={true}
                rowSelection="single"
                quickFilterText={quickFilterText}
                theme="legacy"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* QUICK SELL DIALOG */}
      <Dialog open={!!medicineToSell} onOpenChange={(open) => !open && setMedicineToSell(null)}>
        <DialogContent className="sm:max-w-[425px] border-emerald-900/30">
          <DialogHeader>
            <DialogTitle>Record Sale</DialogTitle>
            <DialogDescription>
              Reduce stock for <strong className="text-emerald-400">{medicineToSell?.medicineName}</strong>. 
              Currently in stock: {medicineToSell?.quantity}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSellSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qtySold" className="text-right">
                  Qty Sold
                </Label>
                <Input
                  id="qtySold"
                  type="number"
                  min="1"
                  max={medicineToSell?.quantity}
                  value={sellQuantity}
                  onChange={(e) => setSellQuantity(e.target.value)}
                  className="col-span-3 bg-muted/50 border-emerald-900/30"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMedicineToSell(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Record Sale
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!medicineToEdit} onOpenChange={(open) => !open && setMedicineToEdit(null)}>
        <DialogContent className="sm:max-w-[425px] border-emerald-900/30">
          <DialogHeader>
            <DialogTitle>Modify Medicine</DialogTitle>
            <DialogDescription>
              Make changes to your medicine entry.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editName" className="text-right">
                  Name
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="col-span-3 bg-muted/50 border-emerald-900/30"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editQuantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="editQuantity"
                  type="number"
                  min="0"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="col-span-3 bg-muted/50 border-emerald-900/30"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPrice" className="text-right">
                  Price (₹)
                </Label>
                <Input
                  id="editPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="col-span-3 bg-muted/50 border-emerald-900/30"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMedicineToEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
