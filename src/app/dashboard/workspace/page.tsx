'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Users,
  Key,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Shield,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  TENANT_PLAN_LABELS,
  TENANT_ROLE_LABELS,
  TENANT_PLAN_LIMITS,
  API_PERMISSION_LABELS,
} from '@/types'
import type {
  TenantPlan,
  TenantRole,
  ApiPermission,
} from '@/types'

interface TenantData {
  id: string
  name: string
  slug: string
  plan: TenantPlan
  memberIds: string[]
  members: { userId: string; email: string; displayName: string; role: TenantRole; joinedAt: string }[]
  settings: Record<string, unknown>
  createdAt: string
}

interface ApiKeyData {
  id: string
  name: string
  maskedKey: string
  environment: 'live' | 'test'
  permissions: string[]
  rateLimit: number
  createdAt: string
  lastUsedAt: string | null
}

export default function WorkspacePage() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<TenantData[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('workspace')

  // Workspace form
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsPlan, setWsPlan] = useState<TenantPlan>('starter')
  const [savingWs, setSavingWs] = useState(false)

  // Invite form
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteTenantId, setInviteTenantId] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TenantRole>('editor')
  const [savingInvite, setSavingInvite] = useState(false)

  // API Key form
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [keyEnv, setKeyEnv] = useState<'live' | 'test'>('live')
  const [keyPerms, setKeyPerms] = useState<ApiPermission[]>([])
  const [keyRateLimit, setKeyRateLimit] = useState(60)
  const [savingKey, setSavingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState('')
  const [showNewKey, setShowNewKey] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [tenantsRes, keysRes] = await Promise.all([
        fetch(`/api/tenants?userId=${user.uid}`),
        fetch(`/api/api-keys?userId=${user.uid}`),
      ])

      if (tenantsRes.ok) {
        const data = await tenantsRes.json()
        setTenants(data.tenants || [])

        // Load API keys for suitable tenants
        if (keysRes.ok) {
          const keysData = await keysRes.json()
          setApiKeys(keysData.keys || [])
        }
      }
    } catch {
      toast.error('Erro ao carregar workspace')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreateWorkspace() {
    if (!user || !wsName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    setSavingWs(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: wsName.trim(),
          ownerId: user.uid,
          ownerEmail: user.email,
          ownerName: user.displayName || user.email,
          plan: wsPlan,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar workspace')
      }

      toast.success('Workspace criado!')
      setCreateDialogOpen(false)
      setWsName('')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar workspace')
    } finally {
      setSavingWs(false)
    }
  }

  async function handleInviteMember() {
    if (!user || !inviteEmail.trim() || !inviteTenantId) {
      toast.error('Email é obrigatório')
      return
    }

    setSavingInvite(true)
    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: inviteTenantId,
          userId: user.uid,
          action: 'invite',
          targetEmail: inviteEmail.trim(),
          targetName: inviteEmail.split('@')[0],
          role: inviteRole,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao convidar membro')
      }

      toast.success('Membro convidado!')
      setInviteDialogOpen(false)
      setInviteEmail('')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao convidar')
    } finally {
      setSavingInvite(false)
    }
  }

  async function handleRemoveMember(tenantId: string, targetUserId: string) {
    if (!user || !confirm('Remover este membro?')) return

    try {
      const res = await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          userId: user.uid,
          action: 'remove',
          targetUserId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Membro removido!')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover')
    }
  }

  async function handleCreateApiKey() {
    if (!user || !keyName.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    const tenantId = tenants[0]?.id
    if (!tenantId) {
      toast.error('Crie um workspace primeiro')
      return
    }

    setSavingKey(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          tenantId,
          name: keyName.trim(),
          environment: keyEnv,
          permissions: keyPerms.length > 0 ? keyPerms : undefined,
          rateLimit: keyRateLimit,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao criar API key')
      }

      const data = await res.json()
      setNewKeyValue(data.key)
      setShowNewKey(true)
      toast.success('API Key criada! Copie agora — ela não será exibida novamente.')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar API key')
    } finally {
      setSavingKey(false)
    }
  }

  async function handleDeleteApiKey(keyId: string) {
    if (!user || !confirm('Revogar esta API key?')) return

    try {
      const res = await fetch(`/api/api-keys?keyId=${keyId}&userId=${user.uid}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('API Key revogada!')
      loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao revogar')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  function togglePermission(perm: ApiPermission) {
    setKeyPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workspace</h1>
        <p className="text-muted-foreground">
          Gerencie workspaces, membros e chaves de API
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workspace">
            <Building2 className="h-4 w-4 mr-2" />
            Workspaces
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Workspaces Tab */}
        <TabsContent value="workspace" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Workspace
            </Button>
          </div>

          {tenants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum Workspace</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Crie um workspace para colaborar com sua equipe
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Workspace
                </Button>
              </CardContent>
            </Card>
          ) : (
            tenants.map((tenant) => {
              const limits = TENANT_PLAN_LIMITS[tenant.plan]
              return (
                <Card key={tenant.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{tenant.name}</CardTitle>
                        <CardDescription>/{tenant.slug}</CardDescription>
                      </div>
                      <Badge>{TENANT_PLAN_LABELS[tenant.plan]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Membros</p>
                        <p className="font-medium">
                          {tenant.members?.length || 1}
                          {limits.members > 0 && ` / ${limits.members}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Imagens / dia</p>
                        <p className="font-medium">
                          {limits.dailyImages === -1 ? 'Ilimitado' : limits.dailyImages}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Brand Kits</p>
                        <p className="font-medium">
                          {limits.brandKits === -1 ? 'Ilimitado' : limits.brandKits}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">API</p>
                        <p className="font-medium">
                          {limits.apiAccess ? 'Habilitado' : 'Não disponível'}
                        </p>
                      </div>
                    </div>

                    {/* Members list */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Membros
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInviteTenantId(tenant.id)
                            setInviteDialogOpen(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Convidar
                        </Button>
                      </div>

                      <div className="divide-y rounded-md border">
                        {(tenant.members || []).map((member) => (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-medium">{member.displayName || member.email}</span>
                              <span className="text-muted-foreground ml-2">
                                ({member.email})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {TENANT_ROLE_LABELS[member.role]}
                              </Badge>
                              {member.role !== 'owner' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    handleRemoveMember(tenant.id, member.userId)
                                  }
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setKeyName('')
                setKeyEnv('live')
                setKeyPerms([])
                setKeyRateLimit(60)
                setNewKeyValue('')
                setShowNewKey(false)
                setKeyDialogOpen(true)
              }}
              disabled={tenants.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </div>

          {tenants.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Crie um workspace antes de gerar API keys.
                </p>
              </CardContent>
            </Card>
          )}

          {apiKeys.length === 0 && tenants.length > 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhuma API Key</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Crie uma chave para usar a API pública do Studio Post
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <Card key={key.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>
                          {key.environment}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.maskedKey}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rate limit: {key.rateLimit}/min
                        {key.lastUsedAt && ` · Último uso: ${new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Workspace Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Workspace</DialogTitle>
            <DialogDescription>Crie um espaço de trabalho compartilhado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="Ex: Minha Agência"
              />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={wsPlan} onValueChange={(v) => setWsPlan(v as TenantPlan)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TENANT_PLAN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateWorkspace} disabled={savingWs}>
              {savingWs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>Adicione um membro ao workspace</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TenantRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleInviteMember} disabled={savingInvite}>
              {savingInvite && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create API Key Dialog */}
      <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova API Key</DialogTitle>
            <DialogDescription>
              Crie uma chave para acessar a API pública
            </DialogDescription>
          </DialogHeader>

          {showNewKey ? (
            <div className="space-y-4 py-2">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm">Guarde esta chave!</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Ela não será exibida novamente. Copie e armazene em local seguro.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                    {newKeyValue}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(newKeyValue)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setKeyDialogOpen(false); setNewKeyValue('') }}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Integração do site"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select value={keyEnv} onValueChange={(v) => setKeyEnv(v as 'live' | 'test')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Produção</SelectItem>
                        <SelectItem value="test">Teste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rate Limit (req/min)</Label>
                    <Input
                      type="number"
                      value={keyRateLimit}
                      onChange={(e) => setKeyRateLimit(parseInt(e.target.value) || 60)}
                      min={10}
                      max={600}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Permissões</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(API_PERMISSION_LABELS) as [ApiPermission, string][]).map(
                      ([perm, label]) => (
                        <div key={perm} className="flex items-center gap-2">
                          <Checkbox
                            id={perm}
                            checked={keyPerms.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <Label
                            htmlFor={perm}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {label}
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deixe vazio para conceder todas as permissões.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateApiKey} disabled={savingKey}>
                  {savingKey && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Key
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
