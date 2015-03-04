import nengo
import numpy as np
import struct

from nengo_viz.components.component import Component


class Value(Component):
    def __init__(self, viz, obj, display_time=True, **kwargs):
        super(Value, self).__init__(viz, **kwargs)
        self.obj = obj
        self.label = viz.viz.get_label(obj)
        self.data = []
        self.n_lines = obj.size_out
        self.display_time = display_time
        self.struct = struct.Struct('<%df' % (1 + self.n_lines))
        with viz.model:
            self.node = nengo.Node(self.gather_data, size_in=obj.size_out)
            self.conn = nengo.Connection(obj, self.node, synapse=None)

    def remove_nengo_objects(self, viz):
        viz.model.connections.remove(self.conn)
        viz.model.nodes.remove(self.node)

    def gather_data(self, t, x):
        self.data.append(self.struct.pack(t, *x))

    def update_client(self, client):
        while len(self.data) > 0:
            data = self.data.pop(0)
            client.write(data, binary=True)

    def javascript(self):
        return ('new VIZ.Value({parent:main, sim:sim, '
                'x:%(x)g, y:%(y)g, label:%(label)s, '
                'width:%(width)g, height:%(height)g, id:%(id)d, '
                'n_lines:%(n_lines)d, display_time:%(display_time)s});' %
                dict(x=self.x, y=self.y, width=self.width, height=self.height,
                     id=id(self), n_lines=self.n_lines, label=`self.label`,
                     display_time = 'true' if self.display_time else 'false'))
