import nengo
import nengo.utils.function_space
import numpy as np

# define your function
def gaussian(points, mag, mean, sd):
    if sd == 0:
        return points*0
    return np.exp(-(points-mean)**2/(2*sd**2))*mag

# build the function space
fs = nengo.utils.function_space.FunctionSpace(gaussian,
                   pts=np.linspace(-1, 1, 200),
                   n_samples=100, n_basis=10,
                   mean=nengo.dists.Uniform(-1, 1), 
                   sd=nengo.dists.Uniform(0.1, 0.3),
                   mag=1)
                   
model = nengo.Network()
with model:
    ens = nengo.Ensemble(n_neurons=500, dimensions=fs.n_basis)
    choice = nengo.Ensemble(n_neurons=1000, dimensions=fs.n_basis, radius=2)
    fs.set_encoders(ens,
                    mean=nengo.dists.Uniform(-1, 1),
                    sd=0.05, mag=1)
    fs.set_eval_points(ens, n_eval_points=5000,
                       mean=nengo.dists.Uniform(-1, 1),
                       sd=nengo.dists.Uniform(0.1, 0.3),
                       mag = nengo.dists.Uniform(0, 1),
                       superimpose=4)
    fs.set_encoders(choice,
                    mean=nengo.dists.Uniform(-1, 1),
                    sd=0.05, mag=1)
    fs.set_eval_points(choice, n_eval_points=5000,
                       mean=nengo.dists.Uniform(-1, 1),
                       sd=nengo.dists.Uniform(0.1, 0.1),
                       mag = nengo.dists.Uniform(-1, 1),
                       superimpose=4)
    
    n_stims = 3
    
    for i in range(n_stims):
        stimulus = fs.make_stimulus_node()
        stimulus.label = 'stim%d' % i
        nengo.Connection(stimulus, ens)
        stim_control = nengo.Node([1, 0, 0.2], label='stim_control %d' % i)
        nengo.Connection(stim_control, stimulus)
    
    plot = fs.make_plot_node(lines=2, n_pts=50)
        
    nengo.Connection(ens, plot[:fs.n_basis], synapse=0.1)


    def collapse(x):
        pts = fs.reconstruct(x)
        peak = np.argmax(pts)
        data = fs.project(gaussian(fs.pts, mag=1, sd=0.2, mean=fs.pts[peak])*2-1)
        return data

    nengo.Connection(ens, choice)
    
    nengo.Connection(choice, choice, function=collapse)
    

    nengo.Connection(choice, plot[fs.n_basis:], synapse=0.1)
    

