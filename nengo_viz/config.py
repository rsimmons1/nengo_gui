import inspect

import nengo

import nengo_viz.components


class Config(nengo.Config):
    def __init__(self):
        super(Config, self).__init__()
        for cls in [nengo.Ensemble, nengo.Node]:
            self.configures(cls)
            self[cls].set_param('pos', nengo.params.Parameter(None))
            self[cls].set_param('size', nengo.params.Parameter(None))
        self.configures(nengo.Network)
        self[nengo.Network].set_param('pos', nengo.params.Parameter(None))
        self[nengo.Network].set_param('size', nengo.params.Parameter(None))
        self[nengo.Network].set_param('expanded', nengo.params.Parameter(False))
        self[nengo.Network].set_param('has_layout', nengo.params.Parameter(False))

        for clsname, cls in inspect.getmembers(nengo_viz.components):
            if inspect.isclass(cls) and issubclass(cls, nengo_viz.components.component.Template):
                if cls != nengo_viz.components.component.Template:
                    self.configures(cls)
                    for k, v in cls.config_params.items():
                        self[cls].set_param(k, nengo.params.Parameter(v))


    def dumps(self, uids):
        lines = []
        for obj, uid in sorted(uids.items(), key=lambda x: x[1]):
            if isinstance(obj, (nengo.Ensemble, nengo.Node, nengo.Network)):
                if self[obj].pos is not None:
                    lines.append('_viz_config[%s].pos=%s' % (uid, self[obj].pos))
                if self[obj].size is not None:
                    lines.append('_viz_config[%s].size=%s' % (uid, self[obj].size))
                if isinstance(obj, nengo.Network):
                    lines.append('_viz_config[%s].expanded=%s' % (uid, self[obj].expanded))
                    lines.append('_viz_config[%s].has_layout=%s' % (uid, self[obj].has_layout))
            elif isinstance(obj, nengo_viz.components.component.Template):
                lines.append('%s = %s' % (uid, obj.code_python(uids)))
                for k in obj.config_params.keys():
                    v = getattr(self[obj], k)
                    lines.append('_viz_config[%s].%s = %g' % (uid, k, v))

        return '\n'.join(lines)