"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Building2, Users, Edit, Trash2 } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [suscripciones, setSuscripciones] = useState<any[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false)
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null)
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null)
  const [empresaUsers, setEmpresaUsers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    estado: 'Activa'
  })

  const loadData = async () => {
    try {
      const [empRes, susRes] = await Promise.all([
        api.get("/empresas"),
        api.get("/suscripciones")
      ])
      setEmpresas(empRes.data)
      setSuscripciones(susRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getPlanDeEmpresa = (idEmpresa: number) => {
    const sub = suscripciones.find(s => s.IdEmpresa === idEmpresa && s.Estado === 'Activa')
    return sub ? sub.Plan.Nombre : "Sin Plan Activo"
  }

  const getLimiteUsuarios = (idEmpresa: number) => {
    const sub = suscripciones.find(s => s.IdEmpresa === idEmpresa && s.Estado === 'Activa')
    return sub ? sub.Plan.LimiteUsuarios : 0
  }

  const openNewModal = () => {
    setEditingEmpresa(null)
    setFormData({ nombre: '', documento: '', telefono: '', email: '', estado: 'Activa' })
    setIsModalOpen(true)
  }

  const openEditModal = (emp: any) => {
    setEditingEmpresa(emp)
    setFormData({
        nombre: emp.Nombre,
        documento: emp.Documento || '',
        telefono: emp.Telefono || '',
        email: emp.Email || '',
        estado: emp.Estado || 'Activa'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
      if (confirm("¿Seguro que deseas eliminar esta empresa? Advertencia: Esto borrará permanentemente sus usuarios y suscripciones.")) {
          try {
              await api.delete(`/empresas/${id}`)
              loadData()
          } catch(e: any) {
              alert(e.response?.data?.error || "Error al eliminar empresa. Verifica si tiene operaciones activas.")
          }
      }
  }

  const viewUsuarios = async (empresa: any) => {
    setSelectedEmpresa(empresa)
    setIsUsersModalOpen(true)
    setEmpresaUsers([])
    try {
      const res = await api.get(`/usuarios?idEmpresa=${empresa.IdEmpresa}`)
      setEmpresaUsers(res.data)
    } catch (e) {
      console.error(e)
      alert("Error verificando usuarios")
    }
  }

  const handleSubmit = async () => {
    try {
      if (editingEmpresa) {
        await api.put(`/empresas/superadmin/${editingEmpresa.IdEmpresa}`, formData)
      } else {
        await api.post("/empresas", formData)
      }
      setIsModalOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert("Ocurrió un error al guardar.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Empresas</h2>
        <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={openNewModal}>
          Nueva Empresa
        </Button>
      </div>
      
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Documento</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Plan Actual</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.IdEmpresa} className={`border-b last:border-0 hover:bg-slate-50 ${emp.Estado === 'Inactiva' ? 'opacity-60' : ''}`}>
                <td className="p-4 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {emp.Nombre} {emp.Estado === 'Inactiva' && <span className="text-xs ml-2 text-red-500 font-bold">(Inactiva)</span>}
                </td>
                <td className="p-4">{emp.Documento || '--'}</td>
                <td className="p-4">{emp.Email}</td>
                <td className="p-4 font-semibold text-orange-600">
                  {getPlanDeEmpresa(emp.IdEmpresa)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-3 flex-wrap">
                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1" onClick={() => viewUsuarios(emp)}>
                          <Users className="w-4 h-4" /> Usuarios
                      </span>
                      <span className="text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-1" onClick={() => openEditModal(emp)}>
                          <Edit className="w-4 h-4" /> Editar
                      </span>
                      <span className="text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-1" onClick={() => handleDelete(emp.IdEmpresa)}>
                          <Trash2 className="w-4 h-4" /> Eliminar
                      </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creación Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</DialogTitle>
            <DialogDescription>{editingEmpresa ? 'Modifica los datos y/o estado de la empresa.' : 'Registra los datos básicos de la empresa. Se auto-creará un administrador.'}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Nombre o Razón Social</Label>
              <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Prestamos XYZ" />
            </div>
            <div className="space-y-2">
              <Label>Email de Contacto</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!editingEmpresa} />
            </div>
            <div className="space-y-2">
              <Label>Documento / RNC (Opcional)</Label>
              <Input value={formData.documento} onChange={e => setFormData({...formData, documento: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
            </div>
            {editingEmpresa && (
                <div className="space-y-2">
                    <Label>Estado Platform</Label>
                    <select className="w-full border rounded-md p-2 outline-none text-sm bg-slate-50"
                        value={formData.estado || 'Activa'} onChange={e => setFormData({...formData, estado: e.target.value})}>
                        <option value="Activa">Activa</option>
                        <option value="Inactiva">Inactiva (Acceso Restringido)</option>
                    </select>
                </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSubmit}>Guardar Empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Visualización de Usuarios */}
      <Dialog open={isUsersModalOpen} onOpenChange={setIsUsersModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prestamistas Asociados: {selectedEmpresa?.Nombre}</DialogTitle>
            <DialogDescription>Listado actual frente al límite de su Plan.</DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-md border">
              <div>
                  <p className="text-sm text-slate-500">Usuarios actuales</p>
                  <p className="text-xl font-bold">{empresaUsers.filter(u => u.Rol !== 'admin_empresa').length}</p>
              </div>
              <div className="text-right">
                  <p className="text-sm text-slate-500">Límite del Plan</p>
                  <p className="text-xl font-bold">{getLimiteUsuarios(selectedEmpresa?.IdEmpresa) || 'N/A'}</p>
              </div>
          </div>

          <div className="max-h-60 overflow-y-auto mt-4 rounded-md border">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100">
                    <tr>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Rol</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                      {empresaUsers.map(u => (
                          <tr key={u.IdUsuario} className="border-t">
                              <td className="p-2">{u.Nombre}</td>
                              <td className="p-2 font-medium">
                                  {u.Rol === 'admin_empresa' ? <span className="text-orange-600 font-bold">Admin Empresa</span> : u.Rol}
                              </td>
                              <td className="p-2 text-slate-500">{u.Email}</td>
                              <td className="p-2"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-sm text-xs">{u.Estado}</span></td>
                          </tr>
                      ))}
                      {empresaUsers.length === 0 && (
                          <tr><td colSpan={4} className="p-4 text-center text-slate-500">No hay usuarios bajo esta empresa</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUsersModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
